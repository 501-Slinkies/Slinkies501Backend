/**
 * @fileoverview Script to migrate legacy CSV data into Firestore.
 * This script reads CSV files for clients, volunteers (staff), and calls,
 * then uses standalone creation functions to populate the corresponding Firestore collections.
 */

const fs = require("fs");
const csv = require("csv-parser");
const { db } = require('./firebase');
// createAddress function now creates a 'destination'
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
 * @returns {number|""} The duration in minutes, or "" if parsing fails.
 */
function parseDuration(durationStr) {
    if (!durationStr) return "";
    let totalMinutes = 0;
    const hourMatch = durationStr.match(/(\d+)\s*hr/);
    const minMatch = durationStr.match(/(\d+)\s*min/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    return totalMinutes > 0 ? totalMinutes : "";
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
 * Checks for an existing destination (f.k.a. address) to avoid duplicates, or creates a new one.
 * @param {object} addressData The address data extracted from a CSV row.
 * @returns {Promise<FirebaseFirestore.DocumentReference>} A reference to the new or existing destination document.
 */
async function createOrFindAddress(addressData) {
    // Ensure defaults are handled before querying
    addressData.state = addressData.state || "NY";
    addressData.zip = addressData.zip || "00000";
    // Add town if not present (use city as fallback)
    addressData.town = addressData.town || addressData.city || "";

    const addressesRef = db.collection('destination');
    const q = addressesRef
        .where('street_address', '==', addressData.street_address)
        .where('city', '==', addressData.city)
        .where('state', '==', addressData.state)
        .where('zip', '==', addressData.zip)
        .where('nickname', '==', addressData.nickname);

    const snapshot = await q.get();

    if (!snapshot.empty) {
        console.log(`Found existing destination for: ${addressData.nickname || addressData.street_address}`);
        return snapshot.docs[0].ref;
    } else {
        console.log(`Creating new destination for: ${addressData.nickname || addressData.street_address}`);
        const newAddress = await createAddress(addressData); // This function now creates a 'destination'
        return db.collection('destination').doc(newAddress.destination_id);
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
            client_id: '', // Will be set by createClient
            organization: '', // Not in CSV
            street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || '',
            address2: row[findKey(row, "ADDRESS 2")]?.trim() || '',
            first_name: row[findKey(row, "FIRST NAME")]?.trim() || '',
            last_name: row[findKey(row, "LAST NAME")]?.trim() || '',
            city: row[findKey(row, "CITY")]?.trim() || '',
            state: row[findKey(row, "STATE")]?.trim() || '',
            zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || '',
            month_and_year_of_birth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || '',
            type_of_residence: row[findKey(row, "TYPE OF RESIDENCE")]?.trim() || '',
            email_address: row[findKey(row, "EMAIL ADDRESS")]?.trim() || '',
            primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || '',
            primary_iscell: row[findKey(row, "Primary isCell")]?.trim().toUpperCase() === 'Y',
            primary_allow_text: row[findKey(row, "Primary allowText")]?.trim().toUpperCase() === 'Y',
            secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || '',
            secondary_iscell: row[findKey(row, "Secondary isCell")]?.trim().toUpperCase() === 'Y',
            secondary_allow_text: row[findKey(row, "Secondary allowText")]?.trim().toUpperCase() === 'Y',
            preferred_contact: row[findKey(row, "PREFERRED CONTACT")]?.trim() || 'phone',
            emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || '',
            emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || '',
            relationship_to_client: row[findKey(row, "RELATIONSHIP TO CLIENT")]?.trim() || '',
            oxygen: row[findKey(row, "OXYGEN")]?.trim().toUpperCase() === 'Y',
            allergies: row[findKey(row, "ALLERGIES")]?.trim() || '',
            mobility_assistance: row[findKey(row, "MOBILITY ASSISTANCE")]?.trim() || '',
            other_limitations: row[findKey(row, "OTHER LIMITATIONS")]?.trim() || '',
            car_height_needed: row[findKey(row, "CAR HEIGHT NEEDED")]?.trim() || '',
            service_animal: row[findKey(row, "SERVICE ANIMAL")]?.trim().toUpperCase() === 'N',
            service_animal_notes: row[findKey(row, "SERVICE ANIMAL NOTES")]?.trim() || '',
            pick_up_instructions: row[findKey(row, "PICK UP INSTRUCTIONS")]?.trim() || '',
            live_alone: row[findKey(row, "LIVE ALONE")]?.trim().toUpperCase() === 'Y',
            gender: row[findKey(row, "M/F")]?.trim() || '',
            how_did_they_hear_about_us: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")]?.trim() || '',
            date_enrolled: row[findKey(row, "Date Enrolled ")]?.trim() || '',
            client_status: row[findKey(row, "CLIENT STATUS")]?.trim() || 'active',
            temp_date: row[findKey(row, "temp date")]?.trim() || '',
            internal_comments: row[findKey(row, "COMMENTS")]?.trim() || '',
            external_comments: '', // Not in CSV
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
            volunteer_id: '', // Will be set by createVolunteer
            organization: '', // Not in CSV
            first_name: row[findKey(row, "FIRST NAME")]?.trim() || '',
            last_name: row[findKey(row, "LAST NAME")]?.trim() || '',
            password: row[findKey(row, "PASSWORD")]?.trim() || 'defaultPassword',
            birth_month_year: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || '',
            street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || '',
            address2: row[findKey(row, "ADDRESS 2")]?.trim() || '',
            city: row[findKey(row, "CITY")]?.trim() || '',
            state: row[findKey(row, "STATE")]?.trim() || '',
            volunteering_status: row[findKey(row, "VOLUNTEERING STATUS")]?.trim() || 'active',
            roles: (row[findKey(row, "VOLUNTEER POSITION")]?.split(';').map(r => r.trim()).filter(Boolean)) || ['driver'],
            email_address: row[findKey(row, "EMAIL ADDRESS")]?.trim() || '',
            primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || '',
            primary_is_cell: row[findKey(row, "primary isCell")]?.trim().toUpperCase() === 'Y',
            primary_text: row[findKey(row, "primary can text")]?.trim().toUpperCase() === 'Y',
            secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || '',
            secondary_is_cell: row[findKey(row, "secondary isCell")]?.trim().toUpperCase() === 'Y',
            secondary_text: row[findKey(row, "secondary canText")]?.trim().toUpperCase() === 'Y',
            contact_type_preference: row[findKey(row, "CONTACT TYPE PREFERENCE")]?.trim() || 'phone',
            emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || '',
            emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || '',
            emergency_contact_relationship: row[findKey(row, "RELATIONSHIP TO VOLUNTEER")]?.trim() || '',
            type_of_vehicle: row[findKey(row, "TYPE OF VEHICLE")]?.trim() || '',
            color: row[findKey(row, "COLOR")]?.trim() || '',
            client_preference_for_drivers: row[findKey(row, "CLIENT PREFERENCE FOR DRIVERS")]?.trim() || '',
            town_preference: row[findKey(row, "TOWN PREFERENCE FOR CLIENT RESIDENCE")]?.trim() || '',
            destination_limitations: row[findKey(row, "DESTINATION LIMITATIONS")]?.trim() || '',
            driver_availability_by_day_and_time: row[findKey(row, "DRIVER AVAILABILITY BY DAY & TIME")]?.trim() || '',
            allergens_in_car: row[findKey(row, "Allergens in Car")]?.trim() || '',
            seat_height_from_ground: parseInt(row[findKey(row, "SEAT HEIGHT FROM GROUND")]) || 0,
            max_rides_week: parseInt(row[findKey(row, "MAX RIDES/WEEK")]) || 0,
            how_heard_about_us: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")]?.trim() || '',
            mileage_reimbursement: row[findKey(row, "MILEAGE REIMBURSEMENT")]?.trim().toUpperCase() === 'Y',
            when_trained_by_lifespan: row[findKey(row, "WHEN TRAINED BY LIFESPAN")]?.trim() || '',
            when_oriented_position: row[findKey(row, "WHEN ORIENTED TO POSITION")]?.trim() || '',
            date_began_volunteering: row[findKey(row, "DATE BEGAN VOLUNTEERING")]?.trim() || '',
            data1_fromdate: row[findKey(row, "Data1_fromDate")]?.trim() || '',
            data2_toDate: row[findKey(row, "Data2_toDate")]?.trim() || '',
            comments: row[findKey(row, "COMMENTS")]?.trim() || '',
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
            // Step 1: Create or find the destination
            const addressData = {
                nickname: row[findKey(row, 'NAME OF DESTINATION/PRACTICE/BUILDING')] || "",
                street_address: row[findKey(row, 'DESTINATION STREET ADDRESS')] || "",
                address_2: row[findKey(row, 'DESTINATION ADDRESS 2')] || "",
                city: row[findKey(row, 'CITY')] || "",
                state: row[findKey(row, 'STATE')] || "",
                zip: row[findKey(row, 'ZIP')] || "",
                town: row[findKey(row, 'TOWN')] || row[findKey(row, 'CITY')] || "",
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

            // Map all required ride fields
            const rideData = {
                ride_id: '', // Will be set by createRide
                organization: '',
                clientUID: clientId, // Pass as string, let createRide handle doc ref if needed
                UID: '', // Will be set by createRide
                additionalClient1_name: '',
                additionalClient1_rel: '',
                driverUID: '', 
                dispatcherUID: '', 
                startLocation: '', 
                destinationUID: '', // Will be set below
                Date: row[findKey(row, 'DATE OF RIDE')] || '',
                appointmentTime: row[findKey(row, 'APPOINTMENT TIME')] || '',
                appointment_type: row[findKey(row, 'PURPOSE OF TRIP')] || '', // No direct mapping, use purpose
                pickupTme: row[findKey(row, 'PICK UP TIME')] || '',
                estimatedDuration: parseDuration(row[findKey(row, 'ESTIMATED LENGTH OF APPOINTMENT')]),
                purpose: row[findKey(row, 'PURPOSE OF TRIP')] || '',
                tripType: parseTripType(row[findKey(row, 'ROUND TRIP OR ONE WAY')]),
                status: 'Not Assigned',
                wheelchair: parseWheelchair(row[findKey(row, 'WHEELCHAIR')]),
                wheelchairType: '', 
                milesDriven: 0,
                volunteerHours: 0, 
                donationReceived: 'None', 
                donationAmount: 0, 
                confirmation1_Date: '',
                confirmation1_By: '',
                confirmation2_Date: '',
                confirmation2_By: '',
                internalComment: '',
                externalComment: row[findKey(row, 'COMMENTS ABOUT RIDE')] || '',
                incidentReport: '',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString(),
            };

            // Set destinationUID as string (let createRide handle doc ref if needed)
            if (addressRef && addressRef.id) {
                rideData.destinationUID = addressRef.id;
            }

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
    migrateCallData.limit = 15;

    console.log("Starting client migration...");
    await migrateClients("./fakeClients.csv");

    console.log("\nStarting volunteer migration...");
    await migrateVolunteers("./fakeStaff.csv");

    console.log("\nStarting call data migration...");
    await migrateCallData("./fakeCalls.csv");

    console.log("\nAll migrations complete.");
})();