import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'lat_lng.dart';
import 'place.dart';
import 'uploaded_file.dart';
import '/backend/backend.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '/backend/schema/structs/index.dart';
import '/auth/firebase_auth/auth_util.dart';

String? unavailabilityStringToHumanReadable(String unavailabilityString) {
  var splitList = unavailabilityString
      .substring(0, unavailabilityString.length - 1)
      .split(";");
  var newString = "";
  var iterTracker = 0;

  for (var substr in splitList) {
    var day = substr.substring(0, substr.length - 5);
    var time = substr.substring(substr.length - 5);
    var hour = int.parse(time.split(":")[0]);
    var pm = false;
    //format hour correctly
    if (hour - 12 > 0) {
      hour = hour - 12;
      pm = true;
    }

    switch (day) {
      case "M":
        day = "Monday ";
        break;
      case "T":
        day = "Tuesday ";
        break;
      case "W":
        day = "Wednesday ";
        break;
      case "Th":
        day = "Thursday ";
        break;
      case "F":
        day = "Friday ";
        break;
      case "S":
        day = "Saturday ";
        break;
      case "Su":
        day = "Sunday ";
        break;
      default:
        break;
    }

    var newSubstr = "";

    if (iterTracker == 0) {
      newSubstr =
          day + hour.toString() + ":" + time.split(":")[1] + (pm ? "PM" : "AM");
      newString = newString + newSubstr;
    } else if (iterTracker % 2 == 0) {
      newSubstr =
          day + hour.toString() + ":" + time.split(":")[1] + (pm ? "PM" : "AM");
      newString = newString + "\n" + newSubstr;
    } else {
      newSubstr =
          hour.toString() + ":" + time.split(":")[1] + (pm ? "PM" : "AM");
      newString = newString + "-" + newSubstr;
    }
    iterTracker++;
    pm = false;
  }
  return newString;
}

String? stringMerginator9000(
  List<String>? stringList,
  bool commaOrSemicolon,
) {
  var outputStr = "";

  if (stringList != null) {
    for (var str in stringList) {
      outputStr = outputStr + (commaOrSemicolon ? ";" : ",") + str;
    }
  }

  return outputStr;
}

List<RidesRecord>? sortMyDataRides(
  bool isAsc,
  int sortColumnIndex,
  List<RidesRecord> listToSort,
) {
  print('Sorting by column index: $sortColumnIndex, ascending: $isAsc');

  int sortResult;
  switch (sortColumnIndex) {
    case 0: // Appt Date
      listToSort.sort((a, b) {
        DateTime aTime = a.appointmentTime ?? DateTime(0);
        DateTime bTime = b.appointmentTime ?? DateTime(0);
        return aTime.compareTo(bTime);
      });
      break;
    case 1: // company
      listToSort.sort((a, b) => a.status.compareTo(b.status));
      break;
    case 2: // email
      listToSort.sort((a, b) => a.endLocation.compareTo(b.endLocation));
      break;

    default:
      print('Invalid sortColumnIndex: $sortColumnIndex');
      return listToSort;
  }
  return isAsc ? listToSort : listToSort.reversed.toList();
}
