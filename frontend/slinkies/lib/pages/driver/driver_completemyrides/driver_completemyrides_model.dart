import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_data_table.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/modals/api_call_fail/api_call_fail_widget.dart';
import '/modals/generic_success/generic_success_widget.dart';
import '/modals/sure_logout/sure_logout_widget.dart';
import '/notused/donation_amount_text_field/donation_amount_text_field_widget.dart';
import '/notused/donations_recieved_text_field/donations_recieved_text_field_widget.dart';
import '/notused/nav_button/nav_button_widget.dart';
import '/notused/total_hours_text_field/total_hours_text_field_widget.dart';
import '/notused/total_miles_textfield/total_miles_textfield_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'driver_completemyrides_widget.dart' show DriverCompletemyridesWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class DriverCompletemyridesModel
    extends FlutterFlowModel<DriverCompletemyridesWidget> {
  ///  Local state fields for this page.

  List<String> completionEntries = [];
  void addToCompletionEntries(String item) => completionEntries.add(item);
  void removeFromCompletionEntries(String item) =>
      completionEntries.remove(item);
  void removeAtIndexFromCompletionEntries(int index) =>
      completionEntries.removeAt(index);
  void insertAtIndexInCompletionEntries(int index, String item) =>
      completionEntries.insert(index, item);
  void updateCompletionEntriesAtIndex(int index, Function(String) updateFn) =>
      completionEntries[index] = updateFn(completionEntries[index]);

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in driver-completemyrides widget.
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
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController1;
  String? Function(BuildContext, String?)? textController1Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue;
  FormFieldController<String>? dropDownValueController;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController2;
  String? Function(BuildContext, String?)? textController2Validator;
  // State field(s) for PaginatedDataTable widget.
  final paginatedDataTableController =
      FlutterFlowDataTableController<RidesRecord>();
  // Models for totalMilesTextfield dynamic component.
  late FlutterFlowDynamicModels<TotalMilesTextfieldModel>
      totalMilesTextfieldModels;
  // Models for totalHoursTextField dynamic component.
  late FlutterFlowDynamicModels<TotalHoursTextFieldModel>
      totalHoursTextFieldModels;
  // Models for donationsRecievedTextField dynamic component.
  late FlutterFlowDynamicModels<DonationsRecievedTextFieldModel>
      donationsRecievedTextFieldModels;
  // Models for donationAmountTextField dynamic component.
  late FlutterFlowDynamicModels<DonationAmountTextFieldModel>
      donationAmountTextFieldModels;
  // Stores action output result for [Backend Call - API (Complete rides)] action in Button widget.
  ApiCallResponse? apiResultk72;

  @override
  void initState(BuildContext context) {
    navButtonModel1 = createModel(context, () => NavButtonModel());
    navButtonModel2 = createModel(context, () => NavButtonModel());
    navButtonModel3 = createModel(context, () => NavButtonModel());
    navButtonModel4 = createModel(context, () => NavButtonModel());
    navButtonModel5 = createModel(context, () => NavButtonModel());
    navButtonModel6 = createModel(context, () => NavButtonModel());
    totalMilesTextfieldModels =
        FlutterFlowDynamicModels(() => TotalMilesTextfieldModel());
    totalHoursTextFieldModels =
        FlutterFlowDynamicModels(() => TotalHoursTextFieldModel());
    donationsRecievedTextFieldModels =
        FlutterFlowDynamicModels(() => DonationsRecievedTextFieldModel());
    donationAmountTextFieldModels =
        FlutterFlowDynamicModels(() => DonationAmountTextFieldModel());
  }

  @override
  void dispose() {
    navButtonModel1.dispose();
    navButtonModel2.dispose();
    navButtonModel3.dispose();
    navButtonModel4.dispose();
    navButtonModel5.dispose();
    navButtonModel6.dispose();
    textFieldFocusNode1?.dispose();
    textController1?.dispose();

    textFieldFocusNode2?.dispose();
    textController2?.dispose();

    paginatedDataTableController.dispose();
    totalMilesTextfieldModels.dispose();
    totalHoursTextFieldModels.dispose();
    donationsRecievedTextFieldModels.dispose();
    donationAmountTextFieldModels.dispose();
  }
}
