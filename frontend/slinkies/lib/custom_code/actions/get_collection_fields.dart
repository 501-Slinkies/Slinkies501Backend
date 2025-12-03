// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!
import 'package:cloud_firestore/cloud_firestore.dart';

Future<List<String>> getCollectionFields(String collectionName) async {
  // 1. Create the Firestore collection reference dynamically
  final CollectionReference collectionRef =
      FirebaseFirestore.instance.collection(collectionName);

  try {
    // 2. Query for the first document in the collection
    QuerySnapshot querySnapshot = await collectionRef.limit(1).get();

    // 3. Check if any document was found
    if (querySnapshot.docs.isNotEmpty) {
      // Get the first document's data as a Map
      DocumentSnapshot documentSnapshot = querySnapshot.docs.first;

      // The data() method returns a Map<String, dynamic>?
      // We safely cast it and ensure it's not null before extracting keys.
      Map<String, dynamic>? data =
          documentSnapshot.data() as Map<String, dynamic>?;

      if (data != null) {
        // 4. Extract all the field names (keys) from the map and return them as a List<String>
        return data.keys.toList();
      }
    }

    // 5. Return an empty list if no documents are found or if the data is null
    return [];
  } catch (e) {
    // Log the error for debugging purposes in FlutterFlow's console
    print('Error fetching collection fields for $collectionName: $e');
    // Return an empty list in case of an error
    return [];
  }
}
