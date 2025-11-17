/**
 * @fileoverview Script to update existing Firestore documents from CSV data.
 * This script reads CSV files and updates matching Firestore documents,
 * fixing empty/null fields with proper values from the CSV.
 */

const fs = require("fs");
const csv = require("csv-parser");
const { admin, db } = require('./firebase');
const DAL = require('./DataAccessLayer.js');
const { hashPassword } = require("./utils/encryption.js");

// Configuration
const DRY_RUN = true; // Set to false to actually update the database
const BATCH_LIMIT = 400;
const ORGANIZATION_TO_UPDATE = "bripen"; // Organization to update

// CSV file paths
const CLIENT_CSV = "./fakeClients.csv";
const VOLUNTEER_CSV = "./fakeStaff.csv";

// Default timestamp for missing dates
const DEFAULT_TIMESTAMP = admin.firestore.Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));

// --- Utility Functions (from csvMigration.js) ---

function findKey(row, target) {
    return Object.keys(row).find(k => k && k.trim().toUpperCase() === target.toUpperCase());
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

/**
 * Update clients from CSV data
 */
async function updateClientsFromCSV() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Updating clients from CSV: ${CLIENT_CSV}`);
    console.log(`${'='.repeat(60)}`);
    
    const rows = await loadCSV(CLIENT_CSV);
    console.log(`Loaded ${rows.length} rows from CSV`);
    
    let batch = DAL.createBatch();
    let batchOps = 0;
    let updatedCount = 0;
    let notFoundCount = 0;
    let totalFieldsUpdated = 0;
    
    for (const row of rows) {
        const firstName = row[findKey(row, "FIRST NAME")]?.trim() || '';
        const lastName = row[findKey(row, "LAST NAME")]?.trim() || '';
        const email = row[findKey(row, "EMAIL ADDRESS")]?.trim() || '';
        
        if (!firstName || !lastName) {
            console.warn(`Skipping row with incomplete name data`);
            continue;
        }
        
        try {
            // Find existing client
            let query;
            if (email) {
                query = db.collection('clients')
                    .where('email_address', '==', email)
                    .where('organization', '==', ORGANIZATION_TO_UPDATE);
            } else {
                query = db.collection('clients')
                    .where('first_name', '==', firstName)
                    .where('last_name', '==', lastName)
                    .where('organization', '==', ORGANIZATION_TO_UPDATE);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                notFoundCount++;
                continue;
            }
            
            const doc = snapshot.docs[0];
            const currentData = doc.data();
            const updates = {};
            
            // Build update object with CSV data
            const csvData = {
                street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || 'N/A',
                address2: row[findKey(row, "ADDRESS 2")]?.trim() || 'N/A',
                city: row[findKey(row, "CITY")]?.trim() || 'Rochester',
                state: row[findKey(row, "STATE")]?.trim() || 'NY',
                zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || '00000',
                month_and_year_of_birth: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || 'N/A',
                type_of_residence: row[findKey(row, "TYPE OF RESIDENCE")]?.trim() || 'N/A',
                email: email || 'N/A',
                email_address: email || 'N/A',
                primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || 'N/A',
                primary_iscell: row[findKey(row, "Primary isCell")]?.trim().toUpperCase() === 'Y',
                primary_allow_text: row[findKey(row, "Primary allowText")]?.trim().toUpperCase() === 'Y',
                secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || 'N/A',
                secondary_iscell: row[findKey(row, "Secondary isCell")]?.trim().toUpperCase() === 'Y',
                secondary_allow_text: row[findKey(row, "Secondary allowText")]?.trim().toUpperCase() === 'Y',
                preferred_contact: row[findKey(row, "PREFERRED CONTACT")]?.trim() || 'phone',
                emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || 'N/A',
                emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || 'N/A',
                relationship_to_client: row[findKey(row, "RELATIONSHIP TO CLIENT")]?.trim() || 'N/A',
                oxygen: row[findKey(row, "OXYGEN")]?.trim().toUpperCase() === 'Y',
                allergies: row[findKey(row, "ALLERGIES")]?.trim() || 'N/A',
                mobility_assistance: row[findKey(row, "MOBILITY ASSISTANCE")]?.trim() || 'N/A',
                other_limitations: row[findKey(row, "OTHER LIMITATIONS")]?.trim() || 'N/A',
                car_height_needed: row[findKey(row, "CAR HEIGHT NEEDED")]?.trim() || 'N/A',
                service_animal: row[findKey(row, "SERVICE ANIMAL")]?.trim().toUpperCase() === 'Y',
                service_animal_breed: row[findKey(row, "BREED")]?.trim() || 'N/A',
                service_animal_size: row[findKey(row, "SIZE")]?.trim() || 'N/A',
                service_animal_notes: row[findKey(row, "SERVICE ANIMAL NOTES")]?.trim() || 'N/A',
                pick_up_instructions: row[findKey(row, "PICK UP INSTRUCTIONS")]?.trim() || 'N/A',
                live_alone: row[findKey(row, "LIVE ALONE")]?.trim().toUpperCase() === 'Y',
                gender: row[findKey(row, "M/F")]?.trim() || 'N/A',
                how_did_they_hear_about_us: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")]?.trim() || 'N/A',
                date_enrolled: row[findKey(row, "Date Enrolled ")]?.trim() || 'N/A',
                client_status: row[findKey(row, "CLIENT STATUS")]?.trim() || 'active',
                temp_date: row[findKey(row, "temp date")]?.trim() || 'N/A',
                comments: row[findKey(row, "COMMENTS")]?.trim() || 'N/A',
                external_comments: currentData.external_comments || 'N/A',
            };
            
            // Check which fields need updating
            for (const [key, value] of Object.entries(csvData)) {
                const currentValue = currentData[key];
                if (currentValue === null || currentValue === undefined || currentValue === '') {
                    updates[key] = value;
                    totalFieldsUpdated++;
                }
            }
            
            if (Object.keys(updates).length > 0) {
                updatedCount++;
                
                if (DRY_RUN) {
                    console.log(`  [DRY RUN] Would update client ${firstName} ${lastName} (${doc.id}): ${Object.keys(updates).join(', ')}`);
                } else {
                    DAL.setBatchDoc(batch, 'clients', doc.id, updates, { merge: true });
                    batchOps++;
                    
                    if (batchOps >= BATCH_LIMIT) {
                        await DAL.commitBatch(batch);
                        console.log(`  Committed batch of ${batchOps} updates`);
                        batch = DAL.createBatch();
                        batchOps = 0;
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error updating client ${firstName} ${lastName}:`, error.message);
        }
    }
    
    if (!DRY_RUN && batchOps > 0) {
        await DAL.commitBatch(batch);
        console.log(`  Committed final batch of ${batchOps} updates`);
    }
    
    console.log(`\nClients update summary:`);
    console.log(`  CSV rows processed: ${rows.length}`);
    console.log(`  Documents ${DRY_RUN ? 'that would be' : ''} updated: ${updatedCount}`);
    console.log(`  Documents not found in Firestore: ${notFoundCount}`);
    console.log(`  Total fields ${DRY_RUN ? 'that would be' : ''} updated: ${totalFieldsUpdated}`);
}

/**
 * Update volunteers from CSV data
 */
async function updateVolunteersFromCSV() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Updating volunteers from CSV: ${VOLUNTEER_CSV}`);
    console.log(`${'='.repeat(60)}`);
    
    const rows = await loadCSV(VOLUNTEER_CSV);
    console.log(`Loaded ${rows.length} rows from CSV`);
    
    let batch = DAL.createBatch();
    let batchOps = 0;
    let updatedCount = 0;
    let notFoundCount = 0;
    let totalFieldsUpdated = 0;
    
    for (const row of rows) {
        const firstName = row[findKey(row, "FIRST NAME")]?.trim() || '';
        const lastName = row[findKey(row, "LAST NAME")]?.trim() || '';
        const email = row[findKey(row, "EMAIL ADDRESS")]?.trim() || '';
        
        if (!firstName || !lastName) {
            console.warn(`Skipping row with incomplete name data`);
            continue;
        }
        
        try {
            // Find existing volunteer
            let query;
            if (email) {
                query = db.collection('volunteers')
                    .where('email_address', '==', email)
                    .where('organization', '==', ORGANIZATION_TO_UPDATE);
            } else {
                query = db.collection('volunteers')
                    .where('first_name', '==', firstName)
                    .where('last_name', '==', lastName)
                    .where('organization', '==', ORGANIZATION_TO_UPDATE);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                notFoundCount++;
                continue;
            }
            
            const doc = snapshot.docs[0];
            const currentData = doc.data();
            const updates = {};
            
            // Build update object with CSV data
            const csvData = {
                birth_month_year: row[findKey(row, "MONTH & YEAR OF BIRTH")]?.trim() || 'N/A',
                street_address: row[findKey(row, "STREET ADDRESS")]?.trim() || 'N/A',
                address2: row[findKey(row, "ADDRESS 2")]?.trim() || 'N/A',
                city: row[findKey(row, "CITY")]?.trim() || 'Rochester',
                state: row[findKey(row, "STATE")]?.trim() || 'NY',
                zip: row[findKey(row, "ZIP")]?.trim() || row[findKey(row, "ZIP ")]?.trim() || '00000',
                volunteering_status: row[findKey(row, "VOLUNTEERING STATUS")]?.trim() || 'active',
                role: (row[findKey(row, "VOLUNTEER POSITION")]?.split(';').map(r => r.trim()).filter(Boolean)) || ['driver'],
                email_address: email || 'N/A',
                primary_phone: row[findKey(row, "PRIMARY PHONE")]?.trim() || 'N/A',
                primary_iscell: row[findKey(row, "primary isCell")]?.trim().toUpperCase() === 'Y',
                primary_text: row[findKey(row, "primary can text")]?.trim().toUpperCase() === 'Y',
                secondary_phone: row[findKey(row, "SECONDARY PHONE")]?.trim() || 'N/A',
                secondary_iscell: row[findKey(row, "secondary isCell")]?.trim().toUpperCase() === 'Y',
                secondary_text: row[findKey(row, "secondary canText")]?.trim().toUpperCase() === 'Y',
                contact_type_preference: row[findKey(row, "CONTACT TYPE PREFERENCE")]?.trim() || 'phone',
                emergency_contact_name: row[findKey(row, "EMERGENCY CONTACT NAME")]?.trim() || 'N/A',
                emergency_contact_phone: row[findKey(row, "EMERGENCY CONTACT PHONE")]?.trim() || 'N/A',
                emergency_contact_relationship: row[findKey(row, "RELATIONSHIP TO VOLUNTEER")]?.trim() || 'N/A',
                type_of_vehicle: row[findKey(row, "TYPE OF VEHICLE")]?.trim() || 'N/A',
                color: row[findKey(row, "COLOR")]?.trim() || 'N/A',
                client_preference_for_drivers: (() => {
                    const raw = row[findKey(row, "CLIENT PREFERENCE FOR DRIVERS")]?.trim();
                    if (!raw || raw === 'N/A') return ['N/A'];
                    const parsed = raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
                    return parsed.length > 0 ? parsed : ['N/A'];
                })(),
                town_preference: row[findKey(row, "TOWN PREFERENCE FOR CLIENT RESIDENCE")]?.trim() || 'N/A',
                destination_limitations: row[findKey(row, "DESTINATION LIMITATIONS")]?.trim() || 'N/A',
                driver_availability_by_day_and_time: row[findKey(row, "DRIVER AVAILABILITY BY DAY & TIME")]?.trim() || 'M08:00;F17:00',
                allergens_in_car: row[findKey(row, "Allergens in Car")]?.trim() || 'N/A',
                seat_height_from_ground: parseInt(row[findKey(row, "SEAT HEIGHT FROM GROUND")]) || 0,
                max_rides_week: parseInt(row[findKey(row, "MAX RIDES/WEEK")]) || 0,
                how_heard_about_us: row[findKey(row, "HOW DID THEY HEAR ABOUT US?")]?.trim() || 'N/A',
                mileage_reimbursement: row[findKey(row, "MILEAGE REIMBURSEMENT")]?.trim().toUpperCase() === 'Y',
                when_trained_by_lifespan: row[findKey(row, "WHEN TRAINED BY LIFESPAN")]?.trim() || 'N/A',
                when_oriented_position: row[findKey(row, "WHEN ORIENTED TO POSITION")]?.trim() || 'N/A',
                date_began_volunteering: row[findKey(row, "DATE BEGAN VOLUNTEERING")]?.trim() || 'N/A',
                comments: row[findKey(row, "COMMENTS")]?.trim() || 'N/A',
                phone_number: row[findKey(row, "PRIMARY PHONE")]?.trim() || 'N/A',
                service_animal_notes: currentData.service_animal_notes || 'N/A',
                photo_url: currentData.photo_url || 'N/A',
            };
            
            // Check which fields need updating
            for (const [key, value] of Object.entries(csvData)) {
                const currentValue = currentData[key];
                // For arrays, check if empty
                if (Array.isArray(currentValue) && currentValue.length === 0) {
                    updates[key] = value;
                    totalFieldsUpdated++;
                } else if (currentValue === null || currentValue === undefined || currentValue === '') {
                    updates[key] = value;
                    totalFieldsUpdated++;
                }
            }
            
            if (Object.keys(updates).length > 0) {
                updatedCount++;
                
                if (DRY_RUN) {
                    console.log(`  [DRY RUN] Would update volunteer ${firstName} ${lastName} (${doc.id}): ${Object.keys(updates).join(', ')}`);
                } else {
                    DAL.setBatchDoc(batch, 'volunteers', doc.id, updates, { merge: true });
                    batchOps++;
                    
                    if (batchOps >= BATCH_LIMIT) {
                        await DAL.commitBatch(batch);
                        console.log(`  Committed batch of ${batchOps} updates`);
                        batch = DAL.createBatch();
                        batchOps = 0;
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error updating volunteer ${firstName} ${lastName}:`, error.message);
        }
    }
    
    if (!DRY_RUN && batchOps > 0) {
        await DAL.commitBatch(batch);
        console.log(`  Committed final batch of ${batchOps} updates`);
    }
    
    console.log(`\nVolunteers update summary:`);
    console.log(`  CSV rows processed: ${rows.length}`);
    console.log(`  Documents ${DRY_RUN ? 'that would be' : ''} updated: ${updatedCount}`);
    console.log(`  Documents not found in Firestore: ${notFoundCount}`);
    console.log(`  Total fields ${DRY_RUN ? 'that would be' : ''} updated: ${totalFieldsUpdated}`);
}

/**
 * Main execution
 */
(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('FIRESTORE CSV DATA UPDATER');
    console.log('='.repeat(60));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE UPDATE'}`);
    console.log(`Organization: ${ORGANIZATION_TO_UPDATE}`);
    console.log('='.repeat(60));
    
    if (!DRY_RUN) {
        console.log('\nWARNING: Running in LIVE UPDATE mode!');
        console.log('This will modify your database. Make sure you have a backup!');
        console.log('Proceeding in 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    try {
        // Update from CSVs
        await updateClientsFromCSV();
        await updateVolunteersFromCSV();
        
        console.log('\n' + '='.repeat(60));
        console.log(`Update process complete${DRY_RUN ? ' (DRY RUN)' : ''}!`);
        console.log('='.repeat(60));
        
        if (DRY_RUN) {
            console.log('\nTo apply these changes, set DRY_RUN = false in the script.');
        }
        
    } catch (error) {
        console.error('\nError during update process:', error);
        throw error;
    }
})();
