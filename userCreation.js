/**
 * @fileoverview Standalone functions for creating client, volunteer, address, and ride records in Firestore.
 */

const { db } = require('./firebase');

/**
 * Validates if a string is a properly formatted email address.
 * @param {string} email The email string to validate.
 * @returns {boolean} True if the email is valid, otherwise false.
 */
function validateEmail(email) {
    // A simple regex for email validation.
    return /\S+@\S+\.\S+/.test(email);
}

/**
 * Creates a new client document in the 'clients' collection.
 * @param {object} clientData - Object containing all client information. All keys should be in snake_case.
 * @returns {Promise<object>} A promise that resolves to the newly created client object, including its UID.
 * @throws {Error} Throws an error if required fields are missing or invalid.
 */
async function createClient(clientData) {
    try {
        // --- Validation ---
        const { first_name, last_name, email, primary_phone } = clientData;
        if (!first_name || !last_name) throw new Error("Missing name for client");
        if (!primary_phone) throw new Error("Missing primary phone for client");
        if (email && !validateEmail(email)) throw new Error("Invalid email format for client");
        if (!email) console.warn("Warning: Missing email for client", first_name, last_name);

        // --- Data Normalization and Defaulting ---

        const client_id = docRef ? docRef.id : null; // Will be set after doc creation
        const contact_type_preference = clientData.contact_type_preference || 'phone';
        const account_status = clientData.account_status || 'active';
        const month_year_of_birth = clientData.month_year_of_birth || '';
        const is_cell = Boolean(clientData.is_cell) || false;
        const ok_to_text = is_cell ? Boolean(clientData.ok_to_text) : false;
        const secondary_phone = clientData.secondary_phone || null;
        const secondary_is_cell = Boolean(clientData.secondary_is_cell) || false;
        const street_address = clientData.street_address || '';
        const address_2 = clientData.address_2 || '';
        const city = clientData.city || '';
        const state = clientData.state || '';
        const zip = clientData.zip || '';
        const emergency_contacts = clientData.emergency_contacts || [];
        const mobility_aid_type = clientData.mobility_aid_type || null;
        const impairments = clientData.impairments || [];
        const service_animal = Boolean(clientData.service_animal) || false;
        const comments = clientData.comments || null;

        // --- Construct Final Client Object ---
        const newClient = {
            // Personal and Contact Info
            first_name,
            last_name,
            month_year_of_birth,
            email: email || '',
            primary_phone,
            is_cell,
            ok_to_text,
            secondary_phone,
            secondary_is_cell,
            // Address Info
            street_address,
            address_2,
            city,
            state,
            zip,
            // Client-Specific Details
            emergency_contacts,
            mobility_aid_type,
            impairments,
            service_animal,
            comments,
            // Metadata
            client_id,
            contact_type_preference,
            account_status,
            date_created: new Date(),
        };

        const docRef = db.collection("clients").doc();
        await docRef.set(newClient);

        console.log(`Successfully created client ${first_name} ${last_name} with ID: ${docRef.id}`);
        return { uid: docRef.id, ...newClient };
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
}

/**
 * Creates a new volunteer document in the 'volunteers' collection.
 * @param {object} volunteerData - Object containing all volunteer information. All keys should be in snake_case.
 * @returns {Promise<object>} A promise that resolves to the newly created volunteer object, including its UID.
 * @throws {Error} Throws an error if required fields are missing or invalid.
 */
async function createVolunteer(volunteerData) {
    try {
        // --- Validation ---
        const { first_name, last_name, email, primary_phone } = volunteerData;
        if (!first_name || !last_name) throw new Error("Missing name for volunteer");
        if (!primary_phone) throw new Error("Missing primary phone for volunteer");
        if (!email) throw new Error("Volunteers must have an email");
        if (!validateEmail(email)) throw new Error("Invalid email for volunteer");

        // --- Data Normalization and Defaulting ---

        const volunteer_id = docRef ? docRef.id : null; // Will be set after doc creation
        const contact_type_preference = volunteerData.contact_type_preference || 'phone';
        const account_status = volunteerData.account_status || 'active';
        const month_year_of_birth = volunteerData.month_year_of_birth || '';
        const is_cell = Boolean(volunteerData.is_cell) || false;
        const ok_to_text = is_cell ? Boolean(volunteerData.ok_to_text) : false;
        const secondary_phone = volunteerData.secondary_phone || null;
        const secondary_is_cell = Boolean(volunteerData.secondary_is_cell) || false;
        const position = volunteerData.position || 'driver';
        const training_date = volunteerData.training_date || null;
        const orientation_date = volunteerData.orientation_date || null;
        const volunteering_start_date = volunteerData.volunteering_start_date || null;
        const unavailability = volunteerData.unavailability || [];
        const vehicle = volunteerData.vehicle || null;
        const max_rides_per_week = volunteerData.max_rides_per_week || 0;
        const town_preference = volunteerData.town_preference || null;
        const destination_limitations = volunteerData.destination_limitations || null;
        const mobility_aid_type = volunteerData.mobility_aid_type || [];
        const mileage_reimbursement = Boolean(volunteerData.mileage_reimbursement) || false;

        // --- Construct Final Volunteer Object ---
        const newVolunteer = {
            // Personal and Contact Info
            first_name,
            last_name,
            month_year_of_birth,
            email,
            primary_phone,
            is_cell,
            ok_to_text,
            secondary_phone,
            secondary_is_cell,
            // Volunteer-Specific Details
            volunteer_id,
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
            // Metadata
            contact_type_preference,
            account_status,
            date_created: new Date(),
        };

        const docRef = db.collection("volunteers").doc();
        await docRef.set(newVolunteer);

        console.log(`Successfully created volunteer ${first_name} ${last_name} with ID: ${docRef.id}`);
        return { uid: docRef.id, ...newVolunteer };
    } catch (error) {
        console.error("Error creating volunteer:", error);
        throw error;
    }
}

/**
 * Creates a new address document in the 'addresses' collection.
 * @param {object} addressData - Object containing address information. Keys should be in snake_case.
 * @returns {Promise<object>} A promise that resolves to the new address object with its ID.
 * @throws {Error} Throws an error if required fields are missing.
 */
async function createAddress(addressData) {
    try {
        // --- Validation ---
        // Only street and city are strictly required. State and Zip can be null.
        const { street_address, city } = addressData;
        if (!street_address || !city) {
            throw new Error("Missing required address fields (street_address, city)");
        }

        // --- Data Normalization and Defaulting ---
        const newAddress = {
            street_address,
            city,
            state: addressData.state || null,
            zip: addressData.zip || null,
            address_2: addressData.address_2 || null,
            nickname: addressData.nickname || null,
            common_purpose: addressData.common_purpose || null,
            date_created: new Date(),
        };

        const docRef = db.collection("addresses").doc();
        await docRef.set(newAddress);

        console.log(`Successfully created address with ID: ${docRef.id}`);
        return { address_id: docRef.id, ...newAddress };
    } catch (error) {
        console.error("Error creating address:", error);
        throw error;
    }
}

/**
 * Creates a new ride document in the 'rides' collection.
 * @param {object} rideData - Object containing ride information. Keys should be in snake_case.
 * @returns {Promise<object>} A promise that resolves to the new ride object with its ID.
 * @throws {Error} Throws an error if required fields are missing.
 */
async function createRide(rideData) {
    try {
        // --- Validation ---
        const { client_ref, date, end_location_address_ref } = rideData;
        if (!client_ref || !date || !end_location_address_ref) {
            throw new Error("Missing required ride fields (client_ref, date, end_location_address_ref)");
        }

        // --- Data Normalization and Defaulting ---
        const wheelchair = Boolean(rideData.wheelchair) || false;
        const newRide = {
            ride_id: null, // Will be set after doc creation
            client_ref,
            date,
            end_location_address_ref,
            additional_client_1_name: rideData.additional_client_1_name || null,
            additional_client_1_rel: rideData.additional_client_1_rel || null,
            driver_volunteer_ref: rideData.driver_volunteer_ref || null,
            dispatcher_uid_string: rideData.dispatcher_uid_string || null,
            start_location_address_ref: rideData.start_location_address_ref || null,
            appointment_time: rideData.appointment_time || null,
            pickup_time: rideData.pickup_time || null,
            estimated_duration: rideData.estimated_duration || null,
            purpose: rideData.purpose || null,
            trip_type: rideData.trip_type || 'OneWay',
            status: rideData.status || 'Scheduled',
            wheelchair,
            wheelchair_type: wheelchair ? (rideData.wheelchair_type || 'Manual') : null,
            miles_driven: rideData.miles_driven || 0,
            volunteer_hours: rideData.volunteer_hours || 0,
            donation_received: rideData.donation_received || 'None',
            donation_amount: rideData.donation_amount || 0,
            confirmation_1_date: rideData.confirmation_1_date || null,
            confirmation_1_by: rideData.confirmation_1_by || null,
            confirmation_2_date: rideData.confirmation_2_date || null,
            confirmation_2_by: rideData.confirmation_2_by || null,
            internal_comments: rideData.internal_comments || null,
            external_comments: rideData.external_comments || null,
            incident_report: rideData.incident_report || null,
            date_created: new Date(),
        };

        const docRef = db.collection("rides").doc();
        await docRef.set(newRide);

        newRide.ride_id = docRef.id; // Set ride_id after creation
        console.log(`Successfully created ride with ID: ${docRef.id}`);
        return { uid: docRef.id, ...newRide };
    } catch (error) {
        console.error("Error creating ride:", error);
        throw error;
    }
}

module.exports = { createClient, createVolunteer, createAddress, createRide };


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