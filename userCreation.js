/**
 * @fileoverview Standalone functions for creating client, volunteer, destination, and ride records in Firestore.
 */

const { db } = require('./firebase');
const crypto = require('crypto');

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
 * Hashes a password with a salt using SHA-256.
 * @param {string} password The plain-text password.
 * @param {string} salt The salt string.
 * @returns {string} The SHA-256 hash as a hex string, or "" if no password.
 */
function hashPassword(password, salt) {
    if (!password) return "";
    // A simple salt-and-hash.
    // For production, consider crypto.pbkdf2Sync for better security (key stretching).
    return crypto.createHash('sha256')
                 .update(password + salt) // Simple concatenation
                 .digest('hex');
}


/**
 * Creates a new client document in the 'clients' collection.
 * (No changes in this function)
 */
async function createClient(clientData) {
    try {
        // --- Validation (using new field names) ---
        const { first_name, last_name, email_address, primary_phone } = clientData;
        if (!first_name || !last_name) throw new Error("Missing name for client");
        if (!primary_phone) throw new Error("Missing primary phone for client");
        if (email_address && !validateEmail(email_address)) throw new Error("Invalid email format for client");
        if (!email_address) console.warn("Warning: Missing email for client", first_name, last_name);

        // --- Data Normalization and Defaulting (using new field names) ---
        const primary_iscell = Boolean(clientData.primary_iscell) || false;
        const secondary_iscell = Boolean(clientData.secondary_iscell) || false;

        // --- Construct Final Client Object (matching new schema) ---
        const newClient = {
            // Personal and Contact Info
            first_name,
            last_name,
            month_and_year_of_birth: clientData.month_and_year_of_birth || '',
            email_address: email_address || '',
            primary_phone,
            primary_iscell,
            primary_allow_text: primary_iscell ? Boolean(clientData.primary_allow_text) : false,
            secondary_phone: clientData.secondary_phone || "", 
            secondary_iscell,
            secondary_allow_text: secondary_iscell ? Boolean(clientData.secondary_allow_text) : false,
            // Address Info
            street_address: clientData.street_address || '',
            address2: clientData.address2 || '',
            city: clientData.city || '',
            state: clientData.state || '',
            zip: clientData.zip || '',
            // Client-Specific Details
            emergency_contact_name: clientData.emergency_contact_name || "", 
            emergency_contact_phone: clientData.emergency_contact_phone || "", 
            relationship_to_client: clientData.relationship_to_client || "", 
            mobility_assistance: clientData.mobility_assistance || "", 
            other_limitations: clientData.other_limitations || "", 
            service_animal: Boolean(clientData.service_animal) || false,
            comments: clientData.comments || "", 
            // Metadata
            client_id: "", 
            organization: clientData.organization || "", 
            type_of_residence: clientData.type_of_residence || "", 
            preferred_contact: clientData.preferred_contact || 'phone',
            oxygen: Boolean(clientData.oxygen) || false,
            allergies: clientData.allergies || "", 
            car_height_needed: clientData.car_height_needed || "", 
            service_animal_breed: clientData.service_animal_breed || "", 
            service_animal_size: clientData.service_animal_size || "", 
            service_animal_notes: clientData.service_animal_notes || "", 
            pick_up_instructions: clientData.pick_up_instructions || "", 
            live_alone: Boolean(clientData.live_alone) || false,
            gender: clientData.gender || "", 
            how_did_they_hear_about_us: clientData.how_did_they_hear_about_us || "", 
            client_status: clientData.client_status || 'active',
            date_enrolled: new Date().toISOString(),
            temp_date: clientData.temp_date || "", 
        };

        const docRef = db.collection("clients").doc();
        newClient.client_id = docRef.id;

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
 * @param {object} volunteerData - Object containing all volunteer information. All keys should match the new schema.
 * @returns {Promise<object>} A promise that resolves to the newly created volunteer object, including its UID.
 * @throws {Error} Throws an error if required fields are missing or invalid.
 */
async function createVolunteer(volunteerData) {
    try {
        // --- Validation (using new field names) ---
        const { first_name, last_name, email_address, primary_phone } = volunteerData;
        if (!first_name || !last_name) throw new Error("Missing name for volunteer");
        if (!primary_phone) throw new Error("Missing primary phone for volunteer");
        if (!email_address) throw new Error("Volunteers must have an email");
        if (!validateEmail(email_address)) throw new Error("Invalid email for volunteer");

        // --- Data Normalization and Defaulting (using new field names) ---
        const primary_is_cell = Boolean(volunteerData.primary_is_cell) || false;
        const secondary_is_cell = Boolean(volunteerData.secondary_is_cell) || false;
        
        const passwordHash = hashPassword(volunteerData.password, salt); // Hash the password

        // --- Construct Final Volunteer Object (matching new schema) ---
        const newVolunteer = {
            // Personal and Contact Info
            first_name,
            last_name,
            birth_month_year: volunteerData.birth_month_year || '',
            email_address,
            primary_phone,
            primary_is_cell,
            primary_text: primary_is_cell ? Boolean(volunteerData.primary_text) : false,
            secondary_phone: volunteerData.secondary_phone || "", 
            secondary_is_cell,
            secondary_text: secondary_is_cell ? Boolean(volunteerData.secondary_text) : false,
            // Address (from schema)
            street_address: volunteerData.street_address || "", 
            address2: volunteerData.address2 || "", 
            city: volunteerData.city || "", 
            state: volunteerData.state || "", 
            // Volunteer-Specific Details
            volunteer_id: "",  // (Will be set to doc.id)
            roles: [volunteerData.role || 'driver'], // <-- UPDATED: 'role' to 'roles' array
            when_trained_by_lifespan: volunteerData.when_trained_by_lifespan || "", 
            when_oriented_position: volunteerData.when_oriented_position || "", 
            date_began_volunteering: volunteerData.date_began_volunteering || "", 
            driver_availability_by_day_and_time: volunteerData.driver_availability_by_day_and_time || "", 
            type_of_vehicle: volunteerData.type_of_vehicle || "", 
            color: volunteerData.color || "", 
            max_rides_week: volunteerData.max_rides_week || 0,
            town_preference: volunteerData.town_preference || "", 
            destination_limitations: volunteerData.destination_limitations || "", 
            mileage_reimbursement: Boolean(volunteerData.mileage_reimbursement) || false,
            // Metadata
            organization: volunteerData.organization || "", 
            contact_type_preference: volunteerData.contact_type_preference || 'phone',
            volunteering_status: volunteerData.volunteering_status || 'active',
            // Other fields from schema
            emergency_contact_name: volunteerData.emergency_contact_name || "", 
            emergency_contact_phone: volunteerData.emergency_contact_phone || "", 
            emergency_contact_relationship: volunteerData.emergency_contact_relationship || "", 
            client_preference_for_drivers: volunteerData.client_preference_for_drivers || "", 
            allergens_in_car: volunteerData.allergens_in_car || "", 
            seat_height_from_ground: volunteerData.seat_height_from_ground || 0,
            how_heard_about_us: volunteerData.how_heard_about_us || "", 
            data1_fromdate: volunteerData.data1_fromdate || "", 
            data2_toDate: volunteerData.data2_toDate || "", 
            comments: volunteerData.comments || "", 
            password_hash: passwordHash,
            date_created: new Date().toISOString(),
        };

        const docRef = db.collection("volunteers").doc();
        newVolunteer.volunteer_id = docRef.id; // Using string doc ID
        
        await docRef.set(newVolunteer);

        console.log(`Successfully created volunteer ${first_name} ${last_name} with ID: ${docRef.id}`);
        return { uid: docRef.id, ...newVolunteer };
    } catch (error) {
        console.error("Error creating volunteer:", error);
        throw error;
    }
}

/**
 * Creates a new destination document in the 'destination' collection.
 */
async function createAddress(addressData) {
    try {
        // --- Validation ---
        const { street_address, city } = addressData;
        if (!street_address || !city) {
            throw new Error("Missing required address fields (street_address, city)");
        }

        // --- Data Normalization and Defaulting (matching new schema) ---
        const newAddress = {
            destination_id: "", 
            street_address,
            city,
            state: addressData.state || "", 
            zip: addressData.zip || "", 
            address_2: addressData.address_2 || "", 
            nickname: addressData.nickname || "", 
            organization: addressData.organization || "", 
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

/**
 * Creates a new ride document in the 'rides' collection.
 */
async function createRide(rideData) {
    try {
        // --- Validation (using new field names) ---
        const { clientUID, Date: rideDate, destinationUID } = rideData;
        if (!clientUID || !rideDate || !destinationUID) {
            throw new Error("Missing required ride fields (clientUID, Date, destinationUID)");
        }

        // --- Data Normalization and Defaulting (matching new schema) ---
        const wheelchair = Boolean(rideData.wheelchair) || false;
        const newRide = {
            ride_id: "", 
            UID: "", 
            organization: rideData.organization || "", 
            clientUID,
            destinationUID,
            Date: rideDate,
            additionalClient1_name: rideData.additionalClient1_name || "", 
            additionalClient1_rel: rideData.additionalClient1_rel || "", 
            driverUID: rideData.driverUID || "", 
            dispatcherUID: rideData.dispatcherUID || "", 
            startLocation: rideData.startLocation || "", 
            appointmentTime: rideData.appointmentTime || "", 
            appointment_type: rideData.appointment_type || "", 
            pickupTme: rideData.pickupTme || "", 
            estimatedDuration: rideData.estimatedDuration || 0,
            purpose: rideData.purpose || "", 
            tripType: rideData.tripType || 'OneWay',
            status: rideData.status || 'Scheduled',
            wheelchair,
            wheelchairType: wheelchair ? (rideData.wheelchairType || 'Manual') : "", 
            milesDriven: rideData.milesDriven || 0,
            volunteerHours: rideData.volunteerHours || 0,
            donationReceived: rideData.donationReceived || 'None',
            donationAmount: rideData.donationAmount || 0,
            confirmation1_Date: rideData.confirmation1_Date || "", 
            confirmation1_By: rideData.confirmation1_By || "", 
            confirmation2_Date: rideData.confirmation2_Date || "", 
            confirmation2_By: rideData.confirmation2_By || "", 
            internalComment: rideData.internalComment || "", 
            externalComment: rideData.externalComment || "", 
            incidentReport: rideData.incidentReport || "", 
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
        };

        const docRef = db.collection("rides").doc();
        newRide.ride_id = docRef.id;
        newRide.UID = docRef.id; // Set 'UID' field as requested

        await docRef.set(newRide);

        console.log(`Successfully created ride with ID: ${docRef.id}`);
        return { uid: docRef.id, ...newRide };
    } catch (error) {
        console.error("Error creating ride:", error);
        throw error;
    }
}

module.exports = { createClient, createVolunteer, createAddress, createRide };