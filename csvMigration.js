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
            ? { account_status: "Away", temp_date: match[2] }
            : { account_status: status, temp_date: null };
    }
    return { account_status: status, temp_date: null };
}

// Extract base user fields from a client row
function extractBaseUserFromClient(row) {
    return {
        first_name: row[findKey(row, "FIRST NAME")]?.trim() || null,
        last_name: row[findKey(row, "LAST NAME")]?.trim() || null,
        street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || null,
        address_2: row[findKey(row, "ADDRESS 2")]?.trim() || null,
        zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || null,
        city: row[findKey(row, "CITY")]?.trim() || null,
        state: row[findKey(row, "STATE")]?.trim() || null,
        email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
        primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
        primary_is_cell: row[findKey(row, "Primary isCell")] === "Y",
        primary_allow_text: row[findKey(row, "Primary allowText")] === "Y",
        secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || null,
        secondary_is_cell: row[findKey(row, "Secondary isCell")] === "Y",
        secondary_allow_text: row[findKey(row, "Secondary allowText")] === "Y",
        emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || null,
        emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || null,
        emergency_contact_relationship: row[findKey(row, "RELATIONSHIP TO CLIENT")]?.trim() || null,
        account_status: row[findKey(row, "CLIENT STATUS")]?.trim() || null,
        temp_date: row[findKey(row, "temp date")]?.trim() || null,
        month_year_of_birth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || null,
        comments: row[findKey(row, "COMMENTS")]?.trim() || null,
    };
}

// Extract base user fields from a volunteer row
function extractBaseUserFromVolunteer(row) {
    const statusObj = normalizeVolunteerStatus(row[findKey(row, "VOLUNTEERING STATUS")]);
    return {
        first_name: row[findKey(row, "FIRST NAME")]?.trim() || null,
        last_name: row[findKey(row, "LAST NAME")]?.trim() || null,
        street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || null,
        address_2: row[findKey(row, "ADDRESS 2")]?.trim() || null,
        zip: row[findKey(row, "ZIP")]?.trim() || null,
        city: row[findKey(row, "CITY")]?.trim() || null,
        state: row[findKey(row, "STATE")]?.trim() || null,
        email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
        primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
        primary_is_cell: row[findKey(row, "primary isCell")] === "Y",
        primary_allow_text: row[findKey(row, "primary can text")] === "Y",
        secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || null,
        secondary_is_cell: row[findKey(row, "secondary isCell")] === "Y",
        secondary_allow_text: row[findKey(row, "secondary canText")] === "Y",
        emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || null,
        emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || null,
        emergency_contact_relationship: row[findKey(row, "RELATIONSHIP TO VOLUNTEER")]?.trim() || null,
        account_status: statusObj.account_status,
        temp_date: statusObj.temp_date,
        month_year_of_birth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || null,
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
            type_of_residence: row[findKey(row, "TYPE OF RESIDENCE")],
            mobility_assistance: row[findKey(row, "MOBILITY ASSISTANCE")],
            other_limitations: row[findKey(row, "OTHER LIMITATIONS")],
            car_height_needed: row[findKey(row, "CAR HEIGHT NEEDED")],
            service_animal: row[findKey(row, "SERVICE ANIMAL")],
            breed: row[findKey(row, "BREED")],
            size: row[findKey(row, "SIZE")],
            oxygen: row[findKey(row, "OXYGEN")],
            allergies: row[findKey(row, "ALLERGIES")],
            pickup_instructions: row[findKey(row, "PICK UP INSTRUCTIONS")],
            date_enrolled: row[findKey(row, "Date Enrolled")],
            live_alone: row[findKey(row, "LIVE ALONE")],
            gender: row[findKey(row, "M/F")],
            how_did_they_hear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
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
            volunteer_position: row[findKey(row, "VOLUNTEER POSITION")],
            user_id: row[findKey(row, "User ID")],
            password: row[findKey(row, "PASSWORD")],
            contact_type_preference: row[findKey(row, "CONTACT TYPE PREFERENCE")],
            driver_availability_by_day_and_time: row[findKey(row, "DRIVER AVAILABILITY BY DAY & TIME")],
            type_of_vehicle: row[findKey(row, "TYPE OF VEHICLE")],
            allergens_in_car: row[findKey(row, "Allergens in Car")],
            color: row[findKey(row, "COLOR")],
            seat_height_from_ground: row[findKey(row, "SEAT HEIGHT FROM GROUND")],
            max_rides_per_week: row[findKey(row, "MAX RIDES/WEEK")],
            town_preference_for_client_residence: row[findKey(row, "TOWN PREFERENCE FOR CLIENT RESIDENCE")],
            destination_limitations: row[findKey(row, "DESTINATION LIMITATIONS")],
            client_preference_for_drivers: row[findKey(row, "CLIENT PREFERENCE FOR DRIVERS")],
            mileage_reimbursement: row[findKey(row, "MILEAGE REIMBURSEMENT")],
            how_did_they_hear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
            when_trained_by_lifespan: row[findKey(row, "WHEN TRAINED BY LIFESPAN")],
            when_oriented_to_position: row[findKey(row, "WHEN ORIENTED TO POSITION")],
            date_began_volunteering: row[findKey(row, "DATE BEGAN VOLUNTEERING")],
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
            type_of_residence: row[findKey(row, "TYPE OF RESIDENCE")],
            mobility_assistance: row[findKey(row, "MOBILITY ASSISTANCE")],
            other_limitations: row[findKey(row, "OTHER LIMITATIONS")],
            car_height_needed: row[findKey(row, "CAR HEIGHT NEEDED")],
            service_animal: row[findKey(row, "SERVICE ANIMAL")],
            breed: row[findKey(row, "BREED")],
            size: row[findKey(row, "SIZE")],
            oxygen: row[findKey(row, "OXYGEN")],
            allergies: row[findKey(row, "ALLERGIES")],
            pickup_instructions: row[findKey(row, "PICK UP INSTRUCTIONS")],
            date_enrolled: row[findKey(row, "Date Enrolled")],
            live_alone: row[findKey(row, "LIVE ALONE")],
            gender: row[findKey(row, "M/F")],
            how_did_they_hear: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")],
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
