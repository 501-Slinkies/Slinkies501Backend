const fs = require("fs");
const csv = require("csv-parser");

let createBaseUser, makeUserClient, makeUserVolunteer;
const users = require("./users.js");
createBaseUser = users.createBaseUser;
makeUserClient = users.makeUserClient;
makeUserVolunteer = users.makeUserVolunteer;

// Utility: Find a key in a row, ignoring case and whitespace
function findKey(row, target) {
    return Object.keys(row).find(k => k.trim().toUpperCase() === target.toUpperCase());
}

// Utility: Normalize account status and temp date for volunteers
function normalizeVolunteerStatus(status) {
    if (!status) return { accountStatus: null, tempDate: null };
    if (status.startsWith("Away from")) {
        // Example: "Away from 11/11/2025 until 04/02/2026"
        const match = status.match(/Away from (.+?) until (.+)/);
        return match
            ? { accountStatus: "Away", tempDate: match[2] }
            : { accountStatus: status, tempDate: null };
    }
    return { accountStatus: status, tempDate: null };
}

// Extract base user fields from a client row
function extractBaseUserFromClient(row) {
    return {
        firstName: row[findKey(row, "FIRST NAME")]?.trim() || null,
        lastName: row[findKey(row, "LAST NAME")]?.trim() || null,
        streetAddress: row[findKey(row, "STREET ADDRESS")]?.trim() || null,
        address2: row[findKey(row, "ADDRESS 2")]?.trim() || null,
        zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || null,
        city: row[findKey(row, "CITY")]?.trim() || null,
        state: row[findKey(row, "STATE")]?.trim() || null,
        email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
        primaryPhone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
        primaryIsCell: row[findKey(row, "Primary isCell")] === "Y",
        primaryAllowText: row[findKey(row, "Primary allowText")] === "Y",
        secondaryPhone: row[findKey(row, "SECONDARY PHONE")]?.trim() || null,
        secondaryIsCell: row[findKey(row, "Secondary isCell")] === "Y",
        secondaryAllowText: row[findKey(row, "Secondary allowText")] === "Y",
        emergencyContactName: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || null,
        emergencyContactPhone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || null,
        emergencyContactRelationship: row[findKey(row, "RELATIONSHIP TO CLIENT")]?.trim() || null,
        accountStatus: row[findKey(row, "CLIENT STATUS")]?.trim() || null,
        tempDate: row[findKey(row, "temp date")]?.trim() || null,
        monthYearOfBirth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || null,
        comments: row[findKey(row, "COMMENTS")]?.trim() || null,
    };
}

// Extract base user fields from a volunteer row
function extractBaseUserFromVolunteer(row) {
    const statusObj = normalizeVolunteerStatus(row[findKey(row, "VOLUNTEERING STATUS")]);
    return {
        firstName: row[findKey(row, "FIRST NAME")]?.trim() || null,
        lastName: row[findKey(row, "LAST NAME")]?.trim() || null,
        streetAddress: row[findKey(row, "STREET ADDRESS")]?.trim() || null,
        address2: row[findKey(row, "ADDRESS 2")]?.trim() || null,
        zip: row[findKey(row, "ZIP")]?.trim() || null,
        city: row[findKey(row, "CITY")]?.trim() || null,
        state: row[findKey(row, "STATE")]?.trim() || null,
        email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
        primaryPhone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
        primaryIsCell: row[findKey(row, "primary isCell")] === "Y",
        primaryAllowText: row[findKey(row, "primary can text")] === "Y",
        secondaryPhone: row[findKey(row, "SECONDARY PHONE")]?.trim() || null,
        secondaryIsCell: row[findKey(row, "secondary isCell")] === "Y",
        secondaryAllowText: row[findKey(row, "secondary canText")] === "Y",
        emergencyContactName: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || null,
        emergencyContactPhone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || null,
        emergencyContactRelationship: row[findKey(row, "RELATIONSHIP TO VOLUNTEER")]?.trim() || null,
        accountStatus: statusObj.accountStatus,
        tempDate: statusObj.tempDate,
        monthYearOfBirth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || null,
        comments: row[findKey(row, "COMMENTS")]?.trim() || null,
    };
}

// Generic CSV reader
function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}


// Process clients
async function migrateClients(filePath) {
    const rows = await loadCSV(filePath);
    // Accept an optional limit argument
    let limit = migrateClients.limit ?? rows.length;
    let count = 0;
    for (const row of rows) {
        if (count++ >= limit) break;
        // Step 1: extract and create base user
        const baseUser = extractBaseUserFromClient(row);
        const { uid } = await createBaseUser(baseUser);

        // Step 2: promote to client with client-specific fields
        await makeUserClient(uid, {
            typeOfResidence: row[findKey(row, "TYPE OF RESIDENCE")],
            mobilityAssistance: row[findKey(row, "MOBILITY ASSISTANCE")],
            otherLimitations: row[findKey(row, "OTHER LIMITATIONS")],
            carHeightNeeded: row[findKey(row, "CAR HEIGHT NEEDED")],
            serviceAnimal: row[findKey(row, "SERVICE ANIMAL")],
            breed: row[findKey(row, "BREED")],
            size: row[findKey(row, "SIZE")],
            oxygen: row[findKey(row, "OXYGEN")],
            allergies: row[findKey(row, "ALLERGIES")],
            pickupInstructions: row[findKey(row, "PICK UP INSTRUCTIONS")],
            dateEnrolled: row[findKey(row, "Date Enrolled")],
            liveAlone: row[findKey(row, "LIVE ALONE")],
            gender: row[findKey(row, "M/F")],
            howDidTheyHear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
            data1: row[findKey(row, "Data1_ClientName")],
            data2: row[findKey(row, "Data2")],
            data3: row[findKey(row, "Data3")],
        });
    }
}

// Process volunteers
async function migrateVolunteers(filePath) {
    const rows = await loadCSV(filePath);
    // Accept an optional limit argument
    let limit = migrateVolunteers.limit ?? rows.length;
    let count = 0;
    for (const row of rows) {
        if (count++ >= limit) break;
        // Step 1: extract and create base user
        const baseUser = extractBaseUserFromVolunteer(row);
        const { uid } = await createBaseUser(baseUser)

        // Step 2: promote to volunteer with volunteer-specific fields
        await makeUserVolunteer(uid, {
            volunteerPosition: row[findKey(row, "VOLUNTEER POSITION")],
            userId: row[findKey(row, "User ID")],
            password: row[findKey(row, "PASSWORD")],
            contactTypePreference: row[findKey(row, "CONTACT TYPE PREFERENCE")],
            driverAvailabilityByDayAndTime: row[findKey(row, "DRIVER AVAILABILITY BY DAY & TIME")],
            typeOfVehicle: row[findKey(row, "TYPE OF VEHICLE")],
            allergensInCar: row[findKey(row, "Allergens in Car")],
            color: row[findKey(row, "COLOR")],
            seatHeightFromGround: row[findKey(row, "SEAT HEIGHT FROM GROUND")],
            maxRidesPerWeek: row[findKey(row, "MAX RIDES/WEEK")],
            townPreferenceForClientResidence: row[findKey(row, "TOWN PREFERENCE FOR CLIENT RESIDENCE")],
            destinationLimitations: row[findKey(row, "DESTINATION LIMITATIONS")],
            clientPreferenceForDrivers: row[findKey(row, "CLIENT PREFERENCE FOR DRIVERS")],
            mileageReimbursement: row[findKey(row, "MILEAGE REIMBURSEMENT")],
            howDidTheyHear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
            whenTrainedByLifespan: row[findKey(row, "WHEN TRAINED BY LIFESPAN")],
            whenOrientedToPosition: row[findKey(row, "WHEN ORIENTED TO POSITION")],
            dateBeganVolunteering: row[findKey(row, "DATE BEGAN VOLUNTEERING")],
            data1: row[findKey(row, "Data1_fromDate")],
            data2: row[findKey(row, "Data2_toDate")],
            data3: row[findKey(row, "Data3")],
        });
    }
}

// Run migrations
(async() => {
    // Specify how many users to migrate at once by setting the 'limit' property
    migrateClients.limit = 1; // Change this number to migrate more clients at once or comment out to process all
    migrateVolunteers.limit = 1; // Change this number to migrate more volunteers at once or comment out to process all
    await migrateClients("./fakeClients.csv");
    await migrateVolunteers("./fakeStaff.csv");
})();


async function migrateClientsPreview(filePath, limit = 5) {
    console.log("calling migrateClientsPreview");
    const rows = await loadCSV(filePath);

    for (const [i, row] of rows.entries()) {
        if (i >= limit) break; // only process first N rows

        // Use the same extraction logic as migrateClients
        const baseUser = extractBaseUserFromClient(row);
        const clientProfile = {
            typeOfResidence: row[findKey(row, "TYPE OF RESIDENCE")],
            mobilityAssistance: row[findKey(row, "MOBILITY ASSISTANCE")],
            otherLimitations: row[findKey(row, "OTHER LIMITATIONS")],
            carHeightNeeded: row[findKey(row, "CAR HEIGHT NEEDED")],
            serviceAnimal: row[findKey(row, "SERVICE ANIMAL")],
            breed: row[findKey(row, "BREED")],
            size: row[findKey(row, "SIZE")],
            oxygen: row[findKey(row, "OXYGEN")],
            allergies: row[findKey(row, "ALLERGIES")],
            pickupInstructions: row[findKey(row, "PICK UP INSTRUCTIONS")],
            dateEnrolled: row[findKey(row, "Date Enrolled")],
            liveAlone: row[findKey(row, "LIVE ALONE")],
            gender: row[findKey(row, "M/F")],
            howDidTheyHear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
            data1: row[findKey(row, "Data1_ClientName")],
            data2: row[findKey(row, "Data2")],
            data3: row[findKey(row, "Data3")],
        };

        // Log the preview as migrateClients would process
        console.log("Base User:", baseUser);
        console.log("Client Profile:", clientProfile);
        console.log("------");
    }
}

// migrateClientsPreview("./fakeClients.csv", 1)
//   .then(() => console.log("Preview finished"))
//   .catch((err) => console.error("Preview failed:", err));
