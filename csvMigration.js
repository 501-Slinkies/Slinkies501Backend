/**
 * @fileoverview Script to migrate legacy CSV data into Firestore.
 * This script reads CSV files for clients, volunteers (staff), and calls,
 * and migrates the data into Firestore.
 */

const fs = require("fs");
const csv = require("csv-parser");
const { admin, db } = require('./firebase');
// createAddress function used to create destination documents
const DAL = require('./DataAccessLayer.js');

// --- Global Lookup Maps ---
// We will populate these as we create clients and volunteers
const clientLookup = new Map();
const volunteerLookup = new Map();

// --- Utility Functions ---

function findKey(row, target) {
    return Object.keys(row).find(k => k && k.trim().toUpperCase() === target.toUpperCase());
}

function parseDuration(durationStr) {
    if (!durationStr) return "";
    let totalMinutes = 0;
    const hourMatch = durationStr.match(/(\d+)\s*hr/);
    const minMatch = durationStr.match(/(\d+)\s*min/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    return totalMinutes > 0 ? totalMinutes : "";
}

function parseWheelchair(wheelchairStr) {
    return wheelchairStr ? wheelchairStr.trim().toUpperCase() === 'Y' : false;
}

function parseTripType(tripTypeStr) {
    if (!tripTypeStr) return "OneWay";
    const normalized = tripTypeStr.toLowerCase().replace(/\s+/g, '');
    return normalized === 'roundtrip' ? 'RoundTrip' : 'OneWay';
}

/**
 * Parses a message string to determine the call type.
 * @param {string} message The raw message text.
 * @returns {string} The categorized call type.
 */
function parseCallType(message) {
    if (!message) return 'Unknown';
    const msg = message.toLowerCase();

    // Check for specific categories first
    if (msg.includes('enroll') || msg.includes('sign up') || msg.includes('new client')) {
        return 'Client Enrollment';
    }
    if (msg.includes('change') || msg.includes('cancel') || msg.includes('reschedule')) {
        return 'Ride Change/Cancellation';
    }
    if (msg.includes('donat')) { // Catches 'donate', 'donation'
        return 'Donation';
    }
    if (msg.includes('volunteer') || msg.includes('drive for you') || msg.includes('new driver')) {
        return 'Driver Interest';
    }
    if (msg.includes('driver') && msg.includes('question')) {
        return 'Driver Question';
    }
    if (msg.includes('concern') || msg.includes('complaint') || msg.includes('problem')) {
        return 'Client Concern';
    }
    
    // Check for broad ride requests last
    if (msg.includes('ride') || msg.includes('appt') || msg.includes('appointment')) {
        return 'Ride Request';
    }
    
    // Default fallback
    return 'Unknown';
}

/**
 * Parse date and optional time into a Firestore Timestamp, or return null when unparseable.
 * dateStr may be like '1/2/2025' or '2025-01-02'. timeStr may be '10:30 AM'.
 */
function parseDateTime(dateStr, timeStr) {
    if (!dateStr && !timeStr) return null;
    if (!dateStr && timeStr) {
        const t = new Date(timeStr);
        return isNaN(t.getTime()) ? null : admin.firestore.Timestamp.fromDate(t);
    }
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    const dt = new Date(combined);
    return isNaN(dt.getTime()) ? null : admin.firestore.Timestamp.fromDate(dt);
}

// Default timestamp to use when CSV is missing a datetime value
const DEFAULT_TIMESTAMP = admin.firestore.Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));

// Create a destination/address document (local to this migration script)
async function createAddress(addressData) {
  try {
    const { street_address, city } = addressData;
    if (!street_address || !city) {
      throw new Error("Missing required address fields (street_address, city)");
    }

    const newAddress = {
        destination_id: "",
        organization: addressData.organization,
        nickname: addressData.nickname || "",
        street_address,
        address_2: addressData.address_2 || "",
        city: city || "Rochester",
        state: addressData.state || "NY",
        zip: addressData.zip || "00000",
        town: addressData.town || city || "Brighton",
        entered_by: addressData.entered_by || "System",
        date_created: new Date().toISOString(),
    };

    const docRef = db.collection("destination").doc();
    newAddress.destination_id = docRef.id;

    await docRef.set(newAddress);

    console.log(`Successfully created destination with ID: ${docRef.id}`);
    return { destination_id: docRef.id, ...newAddress };
  } catch (error) {
    console.error("Error creating destination:", error);
    throw error;
  }
}


async function createOrFindAddress(addressData) {
    addressData.state = addressData.state || "NY";
    addressData.zip = addressData.zip || "00000";
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
    }

    console.log(`Creating new destination for: ${addressData.nickname || addressData.street_address}`);
    const newAddress = await createAddress(addressData);
    return db.collection('destination').doc(newAddress.destination_id);
}

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

async function migrateClients(filePath, organization) {
    const rows = await loadCSV(filePath);
    let limit = migrateClients.limit ?? rows.length;
    
    // counters for logging
    let count = 0;
    let createdCount = 0;
    let skippedCount = 0;

    const BATCH_LIMIT = 400;
    let batch = DAL.createBatch();
    let ops = 0;

    console.log("Migrating clients, checking for duplicates, and building lookup map...");

    for (const row of rows) {
        if (count++ >= limit) break;

        // --- 1. Get Key Fields ---
        const firstName = row[findKey(row, "FIRST NAME")]?.trim() || '';
        const lastName = row[findKey(row, "LAST NAME")]?.trim() || '';
        const email = row[findKey(row, "EMAIL ADDRESS")]?.trim() || ''; // Use 'EMAIL ADDRESS' for query
        
        // This key is used for the lookup map, regardless of duplicate status
        const lookupKey = (firstName + lastName).toUpperCase().replace(/\s/g, '');

        try {
            // --- 2. NEW: Duplicate Check Logic ---
            let existingClientQuery;
            if (email) {
                // Option 1: Check by email + org
                existingClientQuery = db.collection('clients')
                    .where('email_address', '==', email)
                    .where('organization', '==', organization);
            } else if (firstName && lastName) {
                // Option 2: Check by name + org
                existingClientQuery = db.collection('clients')
                    .where('first_name', '==', firstName)
                    .where('last_name', '==', lastName)
                    .where('organization', '==', organization);
            } else {
                console.warn(`Skipping client row ${count}: No email or full name to use as a unique key.`);
                skippedCount++;
                continue; // Skip this row entirely
            }

            const snapshot = await existingClientQuery.get();
            let docId; // This will holds the client's Firestore ID

            if (snapshot.empty) {
                // --- 3a. This is a NEW client ---
                createdCount++;

                const clientData = {
                    client_id: '',
                    organization: organization,
                    street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || '',
                    address2: row[findKey(row, "ADDRESS 2")]?.trim() || '',
                    first_name: firstName,
                    last_name: lastName,
                    city: row[findKey(row, "CITY")]?.trim() || '',
                    state: row[findKey(row, "STATE")]?.trim() || '',
                    zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || '00000',
                    month_and_year_of_birth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || '',
                    type_of_residence: row[findKey(row, "TYPE OF RESIDENCE")]?.trim() || '',
                    email: row[findKey(row, "EMAIL")]?.trim() || '',
                    email_address: email,
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
                    service_animal: row[findKey(row, "SERVICE ANIMAL")]?.trim().toUpperCase() === 'Y',
                    service_animal_breed: row[findKey(row, "BREED")]?.trim() || '',
                    service_animal_size: row[findKey(row, "SIZE")]?.trim() || '',
                    service_animal_notes: row[findKey(row, "SERVICE ANIMAL NOTES")]?.trim() || '',
                    pick_up_instructions: row[findKey(row, "PICK UP INSTRUCTIONS")]?.trim() || '',
                    live_alone: row[findKey(row, "LIVE ALONE")]?.trim().toUpperCase() === 'Y',
                    gender: row[findKey(row, "M/F")]?.trim() || '',
                    how_did_they_hear_about_us: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")]?.trim() || '',
                    date_enrolled: row[findKey(row, "Date Enrolled ")]?.trim() || '',
                    client_status: row[findKey(row, "CLIENT STATUS")]?.trim() || 'active',
                    temp_date: row[findKey(row, "temp date")]?.trim() || '',
                    comments: row[findKey(row, "COMMENTS")]?.trim() || '',
                    external_comments: '',
                };

                const docRef = db.collection('clients').doc();
                clientData.client_id = docRef.id;
                docId = docRef.id; // Get the new ID
                
                DAL.setBatchDoc(batch, 'clients', docId, clientData, { merge: false });
                ops++;
                
            } else {
                // --- 3b. This is a DUPLICATE client ---
                docId = snapshot.docs[0].id; // Get the existing ID
                skippedCount++;
                console.warn(`Found existing client for: ${firstName} ${lastName} (ID: ${docId}). Skipping creation.`);
            }
            
            // --- 4. Build the Lookup Map (for both new and existing) ---
            if (lookupKey && docId) {
                // We map the Name-Key to the Firestore ID
                clientLookup.set(lookupKey, docId);
            }

            // --- 5. Check and commit batch ---
            if (ops >= BATCH_LIMIT) {
                await DAL.commitBatch(batch);
                console.log(`Committed batch of ${ops} new clients.`);
                batch = DAL.createBatch();
                ops = 0;
            }

        } catch (error) {
            console.error(`Failed to migrate client row ${count}: ${error.message}`, row);
        }
    } // End of for loop

    if (ops > 0) {
        await DAL.commitBatch(batch);
        console.log(`Committed final batch of ${ops} new clients.`);
    }
    console.log(`Client migration finished. Processed ${count} rows. Created ${createdCount} new clients. Found and skipped ${skippedCount} duplicates. Lookup map size: ${clientLookup.size}`);
}

async function migrateVolunteers(filePath, organization) {
    const rows = await loadCSV(filePath);
    let limit = migrateVolunteers.limit ?? rows.length;
    
    // counters for logging
    let count = 0;
    let createdCount = 0; 
    let skippedCount = 0;

    const BATCH_LIMIT = 400;
    let batch = DAL.createBatch();
    let ops = 0;

    console.log("Migrating volunteers, checking for duplicates, and building lookup map...");

    for (const row of rows) {
        if (count++ >= limit) break;

        // --- 1. Get Key Fields ---
        const firstName = row[findKey(row, "FIRST NAME")]?.trim() || '';
        const lastName = row[findKey(row, "LAST NAME")]?.trim() || '';
        const email = row[findKey(row, "EMAIL ADDRESS")]?.trim() || '';

        // This key is used for the lookup map, regardless of duplicate status
        const lookupKey = (firstName + lastName).toUpperCase().replace(/\s/g, '');

        try {
            // --- 2. NEW: Duplicate Check Logic ---
            let existingVolunteerQuery;
            if (email) {
                // Option 1: Check by email + org
                existingVolunteerQuery = db.collection('volunteers')
                    .where('email_address', '==', email)
                    .where('organization', '==', organization);
            } else if (firstName && lastName) {
                // Option 2: Check by name + org
                existingVolunteerQuery = db.collection('volunteers')
                    .where('first_name', '==', firstName)
                    .where('last_name', '==', lastName)
                    .where('organization', '==', organization);
            } else {
                console.warn(`Skipping volunteer row ${count}: No email or full name to use as a unique key.`);
                skippedCount++;
                continue; // Skip this row entirely
            }

            const snapshot = await existingVolunteerQuery.get();
            let docId; // This will hold the volunteer's Firestore ID

            if (snapshot.empty) {
                // --- 3a. This is a NEW volunteer ---
                createdCount++; // Increment volunteer counter

                const volunteerData = {
                    uid: '', // Will be set below
                    organization: organization,
                    first_name: firstName,
                    last_name: lastName,
                    password: row[findKey(row, "PASSWORD")]?.trim() || 'defaultPassword',
                    birth_month_year: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || '',
                    street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || '',
                    address2: row[findKey(row, "ADDRESS 2")]?.trim() || '',
                    city: row[findKey(row, "CITY")]?.trim() || '',
                    state: row[findKey(row, "STATE")]?.trim() || '',
                    zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || '00000',
                    volunteering_status: row[findKey(row, "VOLUNTEERING STATUS")]?.trim() || 'active',
                    role: (row[findKey(row, "VOLUNTEER POSITION")]?.split(';').map(r => r.trim()).filter(Boolean)) || ['driver'],
                    email_address: email, // Use the 'email' variable
                    primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || '',
                    primary_iscell: row[findKey(row, "primary isCell")]?.trim().toUpperCase() === 'Y',
                    primary_text: row[findKey(row, "primary can text")]?.trim().toUpperCase() === 'Y',
                    secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || '',
                    secondary_iscell: row[findKey(row, "secondary isCell")]?.trim().toUpperCase() === 'Y',
                    secondary_text: row[findKey(row, "secondary canText")]?.trim().toUpperCase() === 'Y',
                    contact_type_preference: row[findKey(row, "CONTACT TYPE PREFERENCE")]?.trim() || 'phone',
                    emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || '',
                    emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || '',
                    emergency_contact_relationship: row[findKey(row, "RELATIONSHIP TO VOLUNTEER")]?.trim() || '',
                    type_of_vehicle: row[findKey(row, "TYPE OF VEHICLE")]?.trim() || '',
                    color: row[findKey(row, "COLOR")]?.trim() || '',
                    client_preference_for_drivers: (() => {
                        const raw = row[findKey(row, "CLIENT PREFERENCE FOR DRIVERS")]?.trim() || '';
                        if (!raw) return [];
                        return raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
                    })(),
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
                    comments: row[findKey(row, "COMMENTS")]?.trim() || '',
                    
                    created_time: admin.firestore.Timestamp.now(),
                    phone_number: row[findKey(row, "PRIMARY PHONE")]?.trim() || '',
                    accepts_serice_animals: false,
                    service_animal_notes: '',
                    oxygen: false,
                    photo_url: '',
                };

                const docRef = db.collection('volunteers').doc();
                volunteerData.uid = docRef.id;
                docId = docRef.id; // Get the new ID
                
                DAL.setBatchDoc(batch, 'volunteers', docId, volunteerData, { merge: false });
                ops++;

            } else {
                // --- 3b. This is a DUPLICATE volunteer ---
                docId = snapshot.docs[0].id; // Get the existing ID
                skippedCount++;
                console.warn(`Found existing volunteer for: ${firstName} ${lastName} (ID: ${docId}). Skipping creation.`);
            }

            // --- 4. Build the Lookup Map (for both new and existing) ---
            if (lookupKey && docId) {
                // We map the Name-Key to the Firestore ID
                volunteerLookup.set(lookupKey, docId);
            }

            // --- 5. Check and commit batch ---
            if (ops >= BATCH_LIMIT) {
                await DAL.commitBatch(batch);
                console.log(`Committed batch of ${ops} new volunteers.`);
                batch = DAL.createBatch();
                ops = 0;
            }

        } catch (error) {
            console.error(`Failed to migrate volunteer row ${count}: ${error.message}`, row);
        }
    } // End of for loop

    if (ops > 0) {
        await DAL.commitBatch(batch);
        console.log(`Committed final batch of ${ops} new volunteers.`);
    }
    console.log(`Volunteer migration finished. Processed ${count} rows. Created ${createdCount} new volunteers. Found and skipped ${skippedCount} duplicates. Lookup map size: ${volunteerLookup.size}`);
}

async function migrateCallData(filePath, organization) {
    const rows = await loadCSV(filePath);
    let limit = migrateCallData.limit ?? rows.length;
    let count = 0;
    
    let rideBatch = DAL.createBatch();
    let rideOps = 0;
    let rideSkipped = 0;
    let callLogBatch = DAL.createBatch();
    let callLogOps = 0;
    let callLogSkipped = 0;
    const BATCH_LIMIT = 400; // Batch limit for each

    // This helper function creates a ride
    // --- NEW: Added 'organization' argument ---
    async function createRideEntry(row, firestoreClientId, organization) { 
        try {
            // Step 1: Create or find the destination
            const addressData = {
                nickname: row[findKey(row, 'NAME OF DESTINATION/PRACTICE/BUILDING')] || "",
                street_address: row[findKey(row, 'DESTINATION STREET ADDRESS')] || "",
                address2: row[findKey(row, 'DESTINATION ADDRESS 2')] || "",
                city: row[findKey(row, 'CITY')] || "Rochester",
                state: row[findKey(row, 'STATE')] || "NY",
                zip: row[findKey(row, 'ZIP')] || "00000",
                town: row[findKey(row, 'TOWN')] || row[findKey(row, 'CITY')] || "Brighton",
                entered_by: "System",
                organization: organization,
            };

            if (!addressData.street_address || !addressData.city) {
                console.warn(`Skipping ride in row ${count}: Missing essential address details.`);
                return;
            }
            const addressRef = await createOrFindAddress(addressData); // This already checks for duplicates

            // Step 2: Normalize and validate date/time
            const rawRideDate = row[findKey(row, 'DATE OF RIDE')]?.trim() || '';
            const parsedRideDate = parseDateTime(rawRideDate);
            if (!parsedRideDate) {
                console.warn(`Skipping ride in row ${count}: Missing or unparseable 'DATE OF RIDE' (${rawRideDate}).`);
                return;
            }

            const rawAppointmentTime = row[findKey(row, 'APPOINTMENT TIME')]?.trim() || '';
            const parsedAppointmentTime = parseDateTime(rawRideDate, rawAppointmentTime);
            
            // --- 3. NEW: Duplicate Check for Ride ---
            const pickupTimeValue = row[findKey(row, 'PICK UP TIME')] || '';
            const destinationIdValue = addressRef.id || '';

            const existingRideQuery = db.collection('rides')
                .where('clientUID', '==', firestoreClientId)
                .where('date', '==', parsedRideDate)
                .where('destinationUID', '==', destinationIdValue)
                .where('pickupTime', '==', pickupTimeValue)
                .where('organization', '==', organization); // Added org as requested

            const rideSnapshot = await existingRideQuery.get();

            if (!rideSnapshot.empty) {
                console.warn(`Skipping ride in row ${count}: Found existing ride. Skipping creation.`);
                rideSkipped++;
                return; // This is a duplicate, skip
            }
            
            // --- 4. Not a duplicate, proceed with creation ---
            const parsedConfirmation1 = parseDateTime(row[findKey(row, 'CONFIRMATION1_DATE')]?.trim() || row[findKey(row, 'CONFIRMATION 1 DATE')]?.trim() || '');
            const parsedConfirmation2 = parseDateTime(row[findKey(row, 'CONFIRMATION2_DATE')]?.trim() || row[findKey(row, 'CONFIRMATION 2 DATE')]?.trim() || '');

            const rideData = {
                UID: '', // Will be set below
                clientUID: firestoreClientId,
                driverUID: '', 
                dispatcherUID: '',
                destinationUID: destinationIdValue,
                organization: organization, // Added field as requested for dupe check
                date: parsedRideDate,
                createdAt: admin.firestore.Timestamp.now(), 
                updatedAt: admin.firestore.Timestamp.now(),
                status: 'Unassigned',
                additionalClient1_Name: '',
                additionalClient1_Rel: '', 
                appointmentTime: parsedAppointmentTime || DEFAULT_TIMESTAMP,
                pickupTime: pickupTimeValue,
                estimatedDuration: parseDuration(row[findKey(row, 'ESTIMATED LENGTH OF APPOINTMENT')]) || 0,
                purpose: row[findKey(row, 'PURPOSE OF TRIP')] || '',
                tripType: parseTripType(row[findKey(row, 'ROUND TRIP OR ONE WAY')]),
                wheelchair: parseWheelchair(row[findKey(row, 'WHEELCHAIR')]),
                wheelchairType: '',
                milesDriven: 0,
                volunteerHours: 0,
                donationReceived: 'None', // Preserving your typo
                donationAmount: 0,
                confirmation1_Date: parsedConfirmation1 || DEFAULT_TIMESTAMP,
                confirmation1_By: row[findKey(row, 'CONFIRMATION1_BY')] || row[findKey(row, 'CONFIRMATION 1 BY')] || '',
                confirmation2_Date: parsedConfirmation2 || DEFAULT_TIMESTAMP,
                confirmation2_By: row[findKey(row, 'CONFIRMATION2_BY')] || row[findKey(row, 'CONFIRMATION 2 BY')] || '',
                internalComment: '',
                externalComment: row[findKey(row, 'COMMENTS ABOUT RIDE')] || '',
                startLocation: '',
                endLocation: '',
            };

            const docRef = db.collection('rides').doc();
            rideData.UID = docRef.id;
            
            DAL.setBatchDoc(rideBatch, 'rides', docRef.id, rideData, { merge: false });
            rideOps++;
            if (rideOps >= BATCH_LIMIT) {
                await DAL.commitBatch(rideBatch);
                rideBatch = DAL.createBatch();
                rideOps = 0;
            }
        } catch (error) {
            console.error(`Failed to create RIDE from row ${count}: ${error.message}`, row);
        }
    }


    async function createCallLogEntry(row, firestoreClientId) {
        try {
            // --- 1. Get Key Fields ---
            const message = row[findKey(row, "MESSAGE")]?.trim() || '';
            const dateOfCallValue = row[findKey(row, "DATE OF RIDE")]?.trim() || '';
            const phoneValue = row[findKey(row, "PHONE NUMBER")]?.trim() || '';

            // --- 2. NEW: Duplicate Check for Call Log ---
            if (!dateOfCallValue || !phoneValue || !message) {
                 console.warn(`Skipping call log in row ${count}: Missing key data for duplicate check (date, phone, or message).`);
                 callLogSkipped++;
                 return;
            }

            const existingCallLogQuery = db.collection('calllogs')
                .where('date_of_call', '==', dateOfCallValue)
                .where('phone_number', '==', phoneValue)
                .where('message', '==', message);

            const callLogSnapshot = await existingCallLogQuery.get();

            if (!callLogSnapshot.empty) {
                console.warn(`Skipping call log in row ${count}: Found existing call log. Skipping creation.`);
                callLogSkipped++;
                return; // This is a duplicate, skip
            }
            
            // --- 3. Not a duplicate, proceed with creation ---
            const callType = parseCallType(message);

            const callLogData = {
                first_name: row[findKey(row, "FIRST NAME")]?.trim() || '',
                last_name: row[findKey(row, "LAST NAME")]?.trim() || '',
                phone_number: phoneValue,
                message: message,
                date_of_call: dateOfCallValue,
                call_type: callType,
                entered_by: 'System',
                forwarded_to_name_and_date: row[findKey(row, "MESSAGE FORWARDED TO NAME AND DATE")]?.trim() || '',
                isRide: false,
                ride_reference: '',
                client_reference: firestoreClientId,
            };

            const docRef = db.collection('calllogs').doc();
            DAL.setBatchDoc(callLogBatch, 'calllogs', docRef.id, callLogData, { merge: false });
            callLogOps++;
            if (callLogOps >= BATCH_LIMIT) {
                await DAL.commitBatch(callLogBatch);
                callLogBatch = DAL.createBatch();
                callLogOps = 0;
            }
        } catch (error) {
            console.error(`Failed to create CALLLOG from row ${count}: ${error.message}`, row);
        }
    }

    // --- Main Migration Loop for Calls ---
    console.log("Starting call data migration, checking for duplicates...");
    for (const row of rows) {
        if (count++ >= limit) break;

        const isRideRequest = row[findKey(row, 'isRideRequest')]?.toUpperCase() === 'TRUE';

        const firstName = row[findKey(row, "FIRST NAME")]?.trim() || '';
        const lastName = row[findKey(row, "LAST NAME")]?.trim() || '';
        const clientKey = (firstName + lastName).toUpperCase().replace(/\s/g, '');
        const firestoreClientId = clientLookup.get(clientKey);

        if (!firestoreClientId) {
            console.warn(`Skipping call log row ${count}: Could not find matching client for "${firstName} ${lastName}"`);
            continue;
        }

        if (isRideRequest) {
            // --- NEW: Pass 'organization' ---
            await createRideEntry(row, firestoreClientId, organization); 
        } else {
            await createCallLogEntry(row, firestoreClientId);
        }
    }

    if (rideOps > 0) await DAL.commitBatch(rideBatch);
    if (callLogOps > 0) await DAL.commitBatch(callLogBatch);
    console.log(`Call data migration finished. Processed ${count} rows.`);
    console.log(`--- Rides: Created ${rideOps}, Skipped ${rideSkipped} duplicates.`);
    console.log(`--- Call Logs: Created ${callLogOps}, Skipped ${callLogSkipped} duplicates.`);
}

// --- Main Execution ---
(async () => {
    // --- SET YOUR ORGANIZATION HERE ---
    const ORGANIZATION_TO_MIGRATE = "bripen";

    if (!ORGANIZATION_TO_MIGRATE) {
        console.error("Error: ORGANIZATION_TO_MIGRATE variable is not set. Halting script.");
        return;
    }

    // Set optional limits for testing, or comment out to process all rows.
    //migrateClients.limit = 5;
    //migrateVolunteers.limit = 5;
    //migrateCallData.limit = 15;

    console.log(`Starting client migration for org: ${ORGANIZATION_TO_MIGRATE}...`);
    await migrateClients("./fakeClients.csv", ORGANIZATION_TO_MIGRATE);

    console.log(`\nStarting volunteer migration for org: ${ORGANIZATION_TO_MIGRATE}...`);
    await migrateVolunteers("./fakeStaff.csv", ORGANIZATION_TO_MIGRATE);

    console.log(`\nStarting call data migration for org: ${ORGANIZATION_TO_MIGRATE}...`);
    await migrateCallData("./fakeCalls.csv", ORGANIZATION_TO_MIGRATE);

    console.log("\nAll migrations complete.");
})();