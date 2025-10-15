const { db } = require('./server');

// Validation helpers
function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

// validateBaseUser expects snake_case fields only
function validateBaseUser(data) {
    const first_name = data && data.first_name;
    const last_name = data && data.last_name;
    if (!first_name || !last_name) throw new Error("Missing name");

    const type = data && data.type; // still keep 'type' as key for kind
    const email = data && data.email;

    if (type === "Volunteer") { // volunteers must have valid email while clients can have none
        if (!email) throw new Error("Volunteers must have an email");
        if (!validateEmail(email)) throw new Error("Invalid email for volunteer");
    } else {
        if (email && !validateEmail(email)) throw new Error("Invalid email for client");
        if (!email) console.warn("Warning: Missing email for client", first_name, last_name);
    }

    const primary_phone = data && data.primary_phone;
    if (!primary_phone) throw new Error("Missing primary phone");
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

        // Expect snake_case inputs only
        const contact_type_preference = userData.contact_type_preference || 'phone';
        const account_status = userData.account_status || 'active';

        const first_name = userData.first_name || '';
        const last_name = userData.last_name || '';
        const month_year_of_birth = userData.month_year_of_birth || '';
        const email = userData.email || '';
        const primary_phone = userData.primary_phone || '';
        const is_cell = Boolean(userData.is_cell) || false;
        const ok_to_text = is_cell ? Boolean(userData.ok_to_text) : false;
        const secondary_phone = userData.secondary_phone || null;
        const secondary_is_cell = Boolean(userData.secondary_is_cell) || false;

        const baseUser = {
            contact_type_preference,
            account_status,

            first_name,
            last_name,
            month_year_of_birth,
            email,
            primary_phone,
            is_cell,
            ok_to_text,
            secondary_phone,
            secondary_is_cell,

            roles: [],
            volunteer_ref: null,
            client_ref: null,
            date_created: new Date(),
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
        // update user doc to indicate client role and client_ref
        t.update(userRef, { type: "Client", client_ref: clientRef });

        const street_address = getField(clientData, 'street_address') || '';
        const address_2 = getField(clientData, 'address_2') || '';
        const city = getField(clientData, 'city') || '';
        const state = getField(clientData, 'state') || '';
        const zip = getField(clientData, 'zip') || '';
        const emergency_contacts = getField(clientData, 'emergency_contacts') || getField(clientData, 'emergency_contact') || [];
        const mobility_aid_type = getField(clientData, 'mobility_aid_type') || null;
        const impairments = getField(clientData, 'impairments') || [];
        const service_animal = Boolean(getField(clientData, 'service_animal')) || false;
        const comments = getField(clientData, 'comments') || null;

        t.set(clientRef, {
            user_ref: userRef,
            street_address,
            address_2,
            city,
            state,
            zip,
            emergency_contacts,
            mobility_aid_type,
            impairments,
            service_animal,
            comments,
            date_created: new Date(),
        });
    });

    return { uid, role: "Client", client_ref: clientRef.path };
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
        // Normalize volunteer fields to snake_case and write
        const access_id = getField(volunteerData, 'access_id') || null;
        const position = getField(volunteerData, 'position') || 'driver';
        const training_date = getField(volunteerData, 'training_date') || null;
        const orientation_date = getField(volunteerData, 'orientation_date') || null;
        const volunteering_start_date = getField(volunteerData, 'volunteering_start_date') || null;
        const unavailability = getField(volunteerData, 'unavailability') || [];
        const vehicle = getField(volunteerData, 'vehicle') || null;
        const max_rides_per_week = getField(volunteerData, 'max_rides_per_week') || 0;
        const town_preference = getField(volunteerData, 'town_preference') || null;
        const destination_limitations = getField(volunteerData, 'destination_limitations') || null;
        const mobility_aid_type = getField(volunteerData, 'mobility_aid_type') || [];
        const mileage_reimbursement = Boolean(getField(volunteerData, 'mileage_reimbursement')) || false;

        t.set(volunteerRef, {
            user_ref: userRef,
            access_id,
            position,
            training_date,
            orientation_date,
            volunteering_start_date,
            unavailability,
            vehicle,
            max_rides_per_week,
            town_preference,
            destination_limitations,
            mobility_aid_type,
            mileage_reimbursement,
            date_created: new Date(),
        });
    });

    return { uid, volunteer_ref: volunteerRef.path };
}

module.exports = {createBaseUser, makeUserClient, makeUserVolunteer};