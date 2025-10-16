/**
 * @fileoverview Script to migrate legacy CSV data into Firestore.
 * This script reads CSV files for clients, volunteers (staff), and calls,
 * then uses standalone creation functions to populate the corresponding Firestore collections.
 */

const fs = require("fs");
const csv = require("csv-parser");
const { db } = require('./firebase');
const { createClient, createVolunteer, createAddress, createRide } = require('./userCreation.js');

// --- Utility Functions ---

/**
 * Finds a key in a CSV row object, ignoring case and leading/trailing whitespace.
 * @param {object} row The row object from the CSV parser.
 * @param {string} target The target key name to find (e.g., "FIRST NAME").
 * @returns {string|undefined} The matching key from the row object.
 */
function findKey(row, target) {
    return Object.keys(row).find(k => k.trim().toUpperCase() === target.toUpperCase());
}

/**
 * Parses a string representing a duration (e.g., "30 min", "1 hr") into an integer of minutes.
 * @param {string} durationStr The string to parse.
 * @returns {number|null} The duration in minutes, or null if parsing fails.
 */
function parseDuration(durationStr) {
    if (!durationStr) return null;
    let totalMinutes = 0;
    const hourMatch = durationStr.match(/(\d+)\s*hr/);
    const minMatch = durationStr.match(/(\d+)\s*min/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Converts a 'Y'/'N' string to a boolean.
 * @param {string} wheelchairStr The string indicating wheelchair need ('Y' or 'N').
 * @returns {boolean} True if the input is 'Y' (case-insensitive), otherwise false.
 */
function parseWheelchair(wheelchairStr) {
    return wheelchairStr ? wheelchairStr.trim().toUpperCase() === 'Y' : false;
}

/**
 * Normalizes the trip type string from the CSV.
 * @param {string} tripTypeStr The raw trip type string.
 * @returns {string} The normalized trip type ("RoundTrip" or "OneWay").
 */
function parseTripType(tripTypeStr) {
    if (!tripTypeStr) return "OneWay";
    const normalized = tripTypeStr.toLowerCase().replace(/\s+/g, '');
    return normalized === 'roundtrip' ? 'RoundTrip' : 'OneWay';
}

/**
 * Checks for an existing address to avoid duplicates, or creates a new one.
 * @param {object} addressData The address data extracted from a CSV row.
 * @returns {Promise<FirebaseFirestore.DocumentReference>} A reference to the new or existing address document.
 */
async function createOrFindAddress(addressData) {
    // Ensure defaults are handled before querying
    addressData.state = addressData.state || null;
    addressData.zip = addressData.zip || null;

    const addressesRef = db.collection('addresses');
    const q = addressesRef
        .where('street_address', '==', addressData.street_address)
        .where('city', '==', addressData.city)
        .where('state', '==', addressData.state)
        .where('zip', '==', addressData.zip)
        .where('nickname', '==', addressData.nickname);

    const snapshot = await q.get();

    if (!snapshot.empty) {
        console.log(`Found existing address for: ${addressData.nickname || addressData.street_address}`);
        return snapshot.docs[0].ref;
    } else {
        console.log(`Creating new address for: ${addressData.nickname || addressData.street_address}`);
        const newAddress = await createAddress(addressData);
        return db.collection('addresses').doc(newAddress.address_id);
    }
}

// --- Generic CSV Loader ---

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

// --- Migration Functions ---

async function migrateClients(filePath) {
    const rows = await loadCSV(filePath);
    let limit = migrateClients.limit ?? rows.length;
    let count = 0;
    for (const row of rows) {
        if (count++ >= limit) break;

        const clientData = {
            first_name: row[findKey(row, "FIRST NAME")]?.trim() || null,
            last_name: row[findKey(row, "LAST NAME")]?.trim() || null,
            primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
            email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
            street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || null,
            address_2: row[findKey(row, "ADDRESS 2")]?.trim() || null,
            city: row[findKey(row, "CITY")]?.trim() || null,
            state: row[findKey(row, "STATE")]?.trim() || null,
            zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || null,
            account_status: row[findKey(row, "CLIENT STATUS")]?.trim() || 'active',
        };

        try {
            await createClient(clientData);
        } catch (error) {
            console.error(`Failed to migrate client row ${count}: ${error.message}`, clientData);
        }
    }
    console.log(`Client migration finished. Processed ${count} rows.`);
}

async function migrateVolunteers(filePath) {
    const rows = await loadCSV(filePath);
    let limit = migrateVolunteers.limit ?? rows.length;
    let count = 0;
    for (const row of rows) {
        if (count++ >= limit) break;

        const volunteerData = {
            first_name: row[findKey(row, "FIRST NAME")]?.trim() || null,
            last_name: row[findKey(row, "LAST NAME")]?.trim() || null,
            primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || null,
            email: row[findKey(row, "EMAIL ADDRESS")]?.trim() || null,
            position: row[findKey(row, "VOLUNTEER POSITION")] || 'driver',
        };

        try {
            await createVolunteer(volunteerData);
        } catch (error) {
            console.error(`Failed to migrate volunteer row ${count}: ${error.message}`, volunteerData);
        }
    }
    console.log(`Volunteer migration finished. Processed ${count} rows.`);
}

async function migrateCallData(filePath) {
    const rows = await loadCSV(filePath);
    let limit = migrateCallData.limit ?? rows.length;
    let count = 0;
    for (const row of rows) {
        if (count++ >= limit) break;

        const isRideRequest = row[findKey(row, 'isRideRequest')]?.toUpperCase() === 'TRUE';
        if (!isRideRequest) {
            console.log(`Skipping row ${count} as it's not a ride request.`);
            continue;
        }

        try {
            // Step 1: Create or find the destination Address
            // ** FIX: Use '|| null' to prevent 'undefined' from being passed **
            const addressData = {
                nickname: row[findKey(row, 'NAME OF DESTINATION/PRACTICE/BUILDING')] || null,
                street_address: row[findKey(row, 'DESTINATION STREET ADDRESS')] || null,
                address_2: row[findKey(row, 'DESTINATION ADDRESS 2')] || null,
                city: row[findKey(row, 'CITY')] || null,
                state: row[findKey(row, 'STATE')] || null,
                zip: row[findKey(row, 'ZIP')] || null,
                common_purpose: row[findKey(row, 'PURPOSE OF TRIP')] || null,
            };

            if (!addressData.street_address || !addressData.city) {
                console.warn(`Skipping ride in row ${count}: Missing essential address details.`);
                continue;
            }
            const addressRef = await createOrFindAddress(addressData);

            // Step 2: Create the Ride document
            const clientId = row[findKey(row, 'Client ID')];
            if (!clientId) {
                console.warn(`Skipping ride in row ${count}: Missing Client ID.`);
                continue;
            }

            const rideData = {
                client_ref: db.collection('clients').doc(clientId),
                end_location_address_ref: addressRef,
                date: row[findKey(row, 'DATE OF RIDE')] || null,
                appointment_time: row[findKey(row, 'APPOINTMENT TIME')] || null,
                pickup_time: row[findKey(row, 'PICK UP TIME')] || null,
                estimated_duration: parseDuration(row[findKey(row, 'ESTIMATED LENGTH OF APPOINTMENT')]),
                purpose: row[findKey(row, 'PURPOSE OF TRIP')] || null,
                trip_type: parseTripType(row[findKey(row, 'ROUND TRIP OR ONE WAY')]),
                wheelchair: parseWheelchair(row[findKey(row, 'WHEELCHAIR')]),
                external_comments: row[findKey(row, 'COMMENTS ABOUT RIDE')] || null,
            };

            await createRide(rideData);

        } catch (error) {
            console.error(`Failed to migrate call data row ${count}: ${error.message}`, row);
        }
    }
    console.log(`Call data migration finished. Processed ${count} rows.`);
}

// --- Main Execution ---

(async () => {
    // Set optional limits for testing, or comment out to process all rows.
    migrateClients.limit = 5;
    migrateVolunteers.limit = 5;
    migrateCallData.limit = 5;

    console.log("Starting client migration...");
    await migrateClients("./fakeClients.csv");

    console.log("\nStarting volunteer migration...");
    await migrateVolunteers("./fakeStaff.csv");

    console.log("\nStarting call data migration...");
    await migrateCallData("./fakeCalls.csv");

    console.log("\nAll migrations complete.");
})();

