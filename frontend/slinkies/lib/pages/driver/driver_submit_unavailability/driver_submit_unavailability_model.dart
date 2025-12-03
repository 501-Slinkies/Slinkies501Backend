import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_button_tabbar.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/modals/api_call_fail/api_call_fail_widget.dart';
import '/modals/availability_notupdated_invalid/availability_notupdated_invalid_widget.dart';
import '/modals/availability_updated/availability_updated_widget.dart';
import '/modals/sure_logout/sure_logout_widget.dart';
import '/notused/nav_button/nav_button_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'driver_submit_unavailability_widget.dart'
    show DriverSubmitUnavailabilityWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class DriverSubmitUnavailabilityModel
    extends FlutterFlowModel<DriverSubmitUnavailabilityWidget> {
  ///  Local state fields for this page.

  DocumentReference? volunteerRef;

  String? unavailabilityString;

  VolunteersRecord? volunteerDoc;

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in driver-submit_unavailability widget.
  VolunteersRecord? userLoggedIn;
  // Model for NavButton component.
  late NavButtonModel navButtonModel1;
  // Model for NavButton component.
  late NavButtonModel navButtonModel2;
  // Model for NavButton component.
  late NavButtonModel navButtonModel3;
  // Model for NavButton component.
  late NavButtonModel navButtonModel4;
  // Model for NavButton component.
  late NavButtonModel navButtonModel5;
  // Model for NavButton component.
  late NavButtonModel navButtonModel6;
  // State field(s) for TabBar widget.
  TabController? tabBarController;
  int get tabBarCurrentIndex =>
      tabBarController != null ? tabBarController!.index : 0;
  int get tabBarPreviousIndex =>
      tabBarController != null ? tabBarController!.previousIndex : 0;

  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController;
  String? get choiceChipsValue =>
      choiceChipsValueController?.value?.firstOrNull;
  set choiceChipsValue(String? val) =>
      choiceChipsValueController?.value = val != null ? [val] : [];
  DateTime? datePicked1;
  DateTime? datePicked2;
  // State field(s) for Checkbox widget.
  bool? checkboxValue;
  // State field(s) for monday-is-available widget.
  bool? mondayIsAvailableValue;
  DateTime? datePicked3;
  DateTime? datePicked4;
  // State field(s) for tuesday-is-available widget.
  bool? tuesdayIsAvailableValue;
  DateTime? datePicked5;
  DateTime? datePicked6;
  // State field(s) for wednesday-is-available widget.
  bool? wednesdayIsAvailableValue;
  DateTime? datePicked7;
  DateTime? datePicked8;
  // State field(s) for thursday-is-available widget.
  bool? thursdayIsAvailableValue;
  DateTime? datePicked9;
  DateTime? datePicked10;
  // State field(s) for friday-is-available widget.
  bool? fridayIsAvailableValue;
  DateTime? datePicked11;
  DateTime? datePicked12;
  // State field(s) for saturday-is-available widget.
  bool? saturdayIsAvailableValue;
  DateTime? datePicked13;
  DateTime? datePicked14;
  // State field(s) for sunday-is-available widget.
  bool? sundayIsAvailableValue;
  DateTime? datePicked15;
  DateTime? datePicked16;
  // Stores action output result for [Backend Call - API (updateUnavailability)] action in Button widget.
  ApiCallResponse? apiResultjbo;
  DateTime? datePicked17;
  // Stores action output result for [Backend Call - API (updateUnavailability)] action in Button widget.
  ApiCallResponse? apiResultrpw;
  DateTime? datePicked18;
  DateTime? datePicked19;
  // Stores action output result for [Backend Call - API (updateUnavailability)] action in Button widget.
  ApiCallResponse? apiResultrpws;

  @override
  void initState(BuildContext context) {
    navButtonModel1 = createModel(context, () => NavButtonModel());
    navButtonModel2 = createModel(context, () => NavButtonModel());
    navButtonModel3 = createModel(context, () => NavButtonModel());
    navButtonModel4 = createModel(context, () => NavButtonModel());
    navButtonModel5 = createModel(context, () => NavButtonModel());
    navButtonModel6 = createModel(context, () => NavButtonModel());
  }

  @override
  void dispose() {
    navButtonModel1.dispose();
    navButtonModel2.dispose();
    navButtonModel3.dispose();
    navButtonModel4.dispose();
    navButtonModel5.dispose();
    navButtonModel6.dispose();
    tabBarController?.dispose();
  }
}
