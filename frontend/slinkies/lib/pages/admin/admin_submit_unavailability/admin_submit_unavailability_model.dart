import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_autocomplete_options_list.dart';
import '/flutter_flow/flutter_flow_button_tabbar.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_data_table.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/forms/create_new_client/create_new_client_widget.dart';
import '/forms/create_new_ride/create_new_ride_widget.dart';
import '/forms/create_new_user/create_new_user_widget.dart';
import '/modals/api_call_fail/api_call_fail_widget.dart';
import '/modals/availability_notupdated_invalid/availability_notupdated_invalid_widget.dart';
import '/modals/availability_updated/availability_updated_widget.dart';
import '/modals/sure_logout/sure_logout_widget.dart';
import '/notused/nav_button/nav_button_widget.dart';
import 'dart:ui';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'admin_submit_unavailability_widget.dart'
    show AdminSubmitUnavailabilityWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class AdminSubmitUnavailabilityModel
    extends FlutterFlowModel<AdminSubmitUnavailabilityWidget> {
  ///  Local state fields for this page.
  /// Reference to user the person is recording unavailable time for
  DocumentReference? volunteerRef;

  String? unavailabilityString;

  VolunteersRecord? volunteerDoc;

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in admin-submit_unavailability widget.
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
  // Model for NavButton component.
  late NavButtonModel navButtonModel7;
  // Model for NavButton component.
  late NavButtonModel navButtonModel8;
  // Model for NavButton component.
  late NavButtonModel navButtonModel9;
  // Model for NavButton component.
  late NavButtonModel navButtonModel10;
  // Model for NavButton component.
  late NavButtonModel navButtonModel11;
  // Model for NavButton component.
  late NavButtonModel navButtonModel12;
  // Model for NavButton component.
  late NavButtonModel navButtonModel13;
  // Model for NavButton component.
  late NavButtonModel navButtonModel14;
  // Model for NavButton component.
  late NavButtonModel navButtonModel15;
  // Model for NavButton component.
  late NavButtonModel navButtonModel16;
  // Model for NavButton component.
  late NavButtonModel navButtonModel17;
  // Model for NavButton component.
  late NavButtonModel navButtonModel18;
  // Model for NavButton component.
  late NavButtonModel navButtonModel19;
  // Model for NavButton component.
  late NavButtonModel navButtonModel20;
  // Model for NavButton component.
  late NavButtonModel navButtonModel21;
  // Model for NavButton component.
  late NavButtonModel navButtonModel22;
  // State field(s) for role-DropDown widget.
  String? roleDropDownValue;
  FormFieldController<String>? roleDropDownValueController;
  // State field(s) for TabBar widget.
  TabController? tabBarController;
  int get tabBarCurrentIndex =>
      tabBarController != null ? tabBarController!.index : 0;
  int get tabBarPreviousIndex =>
      tabBarController != null ? tabBarController!.previousIndex : 0;

  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for PaginatedDataTable widget.
  final paginatedDataTableController =
      FlutterFlowDataTableController<VolunteersRecord>();
  // State field(s) for TextField widget.
  final textFieldKey = GlobalKey();
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? textFieldSelectedOption;
  String? Function(BuildContext, String?)? textControllerValidator;
  // Stores action output result for [Custom Action - getVolunteerRecord] action in TextField widget.
  DocumentReference? gotRefCopy;
  // Stores action output result for [Backend Call - Read Document] action in TextField widget.
  VolunteersRecord? voldoc;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
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
    navButtonModel7 = createModel(context, () => NavButtonModel());
    navButtonModel8 = createModel(context, () => NavButtonModel());
    navButtonModel9 = createModel(context, () => NavButtonModel());
    navButtonModel10 = createModel(context, () => NavButtonModel());
    navButtonModel11 = createModel(context, () => NavButtonModel());
    navButtonModel12 = createModel(context, () => NavButtonModel());
    navButtonModel13 = createModel(context, () => NavButtonModel());
    navButtonModel14 = createModel(context, () => NavButtonModel());
    navButtonModel15 = createModel(context, () => NavButtonModel());
    navButtonModel16 = createModel(context, () => NavButtonModel());
    navButtonModel17 = createModel(context, () => NavButtonModel());
    navButtonModel18 = createModel(context, () => NavButtonModel());
    navButtonModel19 = createModel(context, () => NavButtonModel());
    navButtonModel20 = createModel(context, () => NavButtonModel());
    navButtonModel21 = createModel(context, () => NavButtonModel());
    navButtonModel22 = createModel(context, () => NavButtonModel());
  }

  @override
  void dispose() {
    navButtonModel1.dispose();
    navButtonModel2.dispose();
    navButtonModel3.dispose();
    navButtonModel4.dispose();
    navButtonModel5.dispose();
    navButtonModel6.dispose();
    navButtonModel7.dispose();
    navButtonModel8.dispose();
    navButtonModel9.dispose();
    navButtonModel10.dispose();
    navButtonModel11.dispose();
    navButtonModel12.dispose();
    navButtonModel13.dispose();
    navButtonModel14.dispose();
    navButtonModel15.dispose();
    navButtonModel16.dispose();
    navButtonModel17.dispose();
    navButtonModel18.dispose();
    navButtonModel19.dispose();
    navButtonModel20.dispose();
    navButtonModel21.dispose();
    navButtonModel22.dispose();
    tabBarController?.dispose();
    paginatedDataTableController.dispose();
    textFieldFocusNode?.dispose();
  }
}
