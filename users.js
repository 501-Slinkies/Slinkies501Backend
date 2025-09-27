const { db } = require('./server');

// Validation helpers
function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function validateBaseUser(data) {
    if (!data.firstName || !data.lastName) throw new Error("Missing name");
    if (data.type === "Volunteer") { // volunteers must have valid email while clients can have none
        if (!data.email) throw new Error("Volunteers must have an email");
        if (!validateEmail(data.email)) throw new Error("Invalid email for volunteer");
    } else {
        if (data.email && !validateEmail(data.email)) throw new Error("Invalid email for client");
        if (!data.email) console.warn("Warning: Missing email for client", data.firstName, data.lastName);
    }
    if (!data.primaryPhone) throw new Error("Missing primary phone");
}

// ** Create a new base user
// Fields expected in userData:
// - type ("Client" or "Volunteer")
// - contactTypePreference (default: "phone")
// - accountStatus (default: "active")
// - firstName, lastName, birthMonthYear, email, primaryPhone
// - isCell, okToText, secondaryPhone, secondaryIsCell
// - volunteerRef, clientRef (set to null)
// - dateCreated (auto) ** //
async function createBaseUser(userData) {
    try {
        validateBaseUser(userData);

        const baseUser = {
            contactTypePreference: userData.contactTypePreference || "phone",
            accountStatus: userData.accountStatus || "active",

            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            birthMonthYear: userData.birthMonthYear || "",
            email: userData.email || "",
            primaryPhone: userData.primaryPhone || "",
            isCell: Boolean(userData.isCell) || false,
            okToText: userData.isCell ? Boolean(userData.okToText) : false,
            secondaryPhone: userData.secondaryPhone || null,
            secondaryIsCell: Boolean(userData.secondaryIsCell) || false,

            roles: [],
            volunteerRef: null,
            clientRef: null,
            dateCreated: new Date(),
        };

        const docRef = db.collection("users").doc();


        await docRef.set(baseUser);

        return { uid: docRef.id, ...baseUser };
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

// Promote user to client
// Fields expected in clientData:
// - streetAddress, address2, city, state, zip
// - emergencyContacts (array)
// - mobilityAidType, impairments (array), serviceAnimal (bool)
// - comments
// - dateCreated (auto)
async function makeUserClient(uid, clientData) {
    const userRef = db.collection("users").doc(uid);
    const clientRef = db.collection("clients").doc(uid);

    await db.runTransaction(async(t) => {
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) throw new Error(`User ${uid} does not exist`);

        t.update(userRef, { type: "Client", clientRef });

        t.set(clientRef, {
            userRef,
            streetAddress: clientData.streetAddress || "",
            address2: clientData.address2 || "",
            city: clientData.city || "",
            state: clientData.state || "",
            zip: clientData.zip || "",
            emergencyContacts: clientData.emergencyContacts || [],
            mobilityAidType: clientData.mobilityAidType || null,
            impairments: clientData.impairments || [],
            serviceAnimal: clientData.serviceAnimal || false,
            comments: clientData.comments || null,
            dateCreated: new Date(),
        });
    });

    return { uid, role: "Client", clientRef: clientRef.path };
}

// Promote user to volunteer
// Fields expected in volunteerData:
// - accessId,
// - trainingDate, orientationDate, volunteeringStartDate
// - unavailability (array)
// - vehicle (object)
// - maxRidesPerWeek (number)
// - townPreference, destinationLimitations
// - mobilityAidType (array), mileageReimbursement (bool)
// - dateCreated (auto)
async function makeUserVolunteer(uid, volunteerData) {
    const userRef = db.collection("users").doc(uid);
    const volunteerRef = db.collection("volunteers").doc(uid);

    await db.runTransaction(async(t) => {
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) throw new Error(`User ${uid} does not exist`);

        t.set(volunteerRef, {
            userRef,
            accessId: volunteerData.accessId || null,
            position: volunteerData.position || "driver",
            trainingDate: volunteerData.trainingDate || null,
            orientationDate: volunteerData.orientationDate || null,
            volunteeringStartDate: volunteerData.volunteeringStartDate || null,
            unavailability: volunteerData.unavailability || [],
            vehicle: volunteerData.vehicle || null,
            maxRidesPerWeek: volunteerData.maxRidesPerWeek || 0,
            townPreference: volunteerData.townPreference || null,
            destinationLimitations: volunteerData.destinationLimitations || null,
            mobilityAidType: volunteerData.mobilityAidType || [],
            mileageReimbursement: volunteerData.mileageReimbursement || false,
            dateCreated: new Date(),
        });
    });

    return { uid, volunteerRef: volunteerRef.path };
}

module.exports = {createBaseUser, makeUserClient, makeUserVolunteer};