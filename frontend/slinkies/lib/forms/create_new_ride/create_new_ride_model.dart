import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_autocomplete_options_list.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/forms/create_destination/create_destination_widget.dart';
import '/forms/create_new_client/create_new_client_widget.dart';
import '/modals/api_call_fail/api_call_fail_widget.dart';
import '/modals/generic_success/generic_success_widget.dart';
import 'dart:ui';
import '/custom_code/actions/index.dart' as actions;
import 'create_new_ride_widget.dart' show CreateNewRideWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class CreateNewRideModel extends FlutterFlowModel<CreateNewRideWidget> {
  ///  Local state fields for this component.

  DocumentReference? clientRef;

  DestinationRecord? destinationRef;

  ///  State fields for stateful widgets in this component.

  DateTime? datePicked1;
  // State field(s) for Dispatcher widget.
  FocusNode? dispatcherFocusNode;
  TextEditingController? dispatcherTextController;
  String? Function(BuildContext, String?)? dispatcherTextControllerValidator;
  // State field(s) for status_DropDown widget.
  String? statusDropDownValue;
  FormFieldController<String>? statusDropDownValueController;
  // State field(s) for TextField widget.
  final textFieldKey1 = GlobalKey();
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController2;
  String? textFieldSelectedOption1;
  String? Function(BuildContext, String?)? textController2Validator;
  // Stores action output result for [Custom Action - getClientRecord] action in TextField widget.
  DocumentReference? clientDetails;
  // Stores action output result for [Firestore Query - Query a collection] action in TextField widget.
  ClientsRecord? actualClientDetails;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController3;
  String? Function(BuildContext, String?)? textController3Validator;
  // State field(s) for TextField-emailaddress widget.
  FocusNode? textFieldEmailaddressFocusNode;
  TextEditingController? textFieldEmailaddressTextController;
  String? Function(BuildContext, String?)?
      textFieldEmailaddressTextControllerValidator;
  // State field(s) for TextField-primaryphone widget.
  FocusNode? textFieldPrimaryphoneFocusNode;
  TextEditingController? textFieldPrimaryphoneTextController;
  String? Function(BuildContext, String?)?
      textFieldPrimaryphoneTextControllerValidator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue1;
  // State field(s) for ClientAddr1 widget.
  FocusNode? clientAddr1FocusNode;
  TextEditingController? clientAddr1TextController;
  String? Function(BuildContext, String?)? clientAddr1TextControllerValidator;
  // State field(s) for ClientAddr2 widget.
  FocusNode? clientAddr2FocusNode;
  TextEditingController? clientAddr2TextController;
  String? Function(BuildContext, String?)? clientAddr2TextControllerValidator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController8;
  String? Function(BuildContext, String?)? textController8Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode4;
  TextEditingController? textController9;
  String? Function(BuildContext, String?)? textController9Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode5;
  TextEditingController? textController10;
  String? Function(BuildContext, String?)? textController10Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode6;
  TextEditingController? textController11;
  String? Function(BuildContext, String?)? textController11Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for Checkbox widget.
  bool? checkboxValue2;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode7;
  TextEditingController? textController12;
  String? Function(BuildContext, String?)? textController12Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode8;
  TextEditingController? textController13;
  String? Function(BuildContext, String?)? textController13Validator;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
  // State field(s) for DropDown widget.
  String? dropDownValue4;
  FormFieldController<String>? dropDownValueController4;
  // State field(s) for Checkbox widget.
  bool? checkboxValue3;
  // State field(s) for Checkbox widget.
  bool? checkboxValue4;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode9;
  TextEditingController? textController14;
  String? Function(BuildContext, String?)? textController14Validator;
  DateTime? datePicked2;
  DateTime? datePicked3;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode10;
  TextEditingController? textController15;
  String? Function(BuildContext, String?)? textController15Validator;
  // Stores action output result for [Firestore Query - Query a collection] action in Row widget.
  DestinationRecord? destQuery;
  // State field(s) for TextField widget.
  final textFieldKey11 = GlobalKey();
  FocusNode? textFieldFocusNode11;
  TextEditingController? textController16;
  String? textFieldSelectedOption11;
  String? Function(BuildContext, String?)? textController16Validator;
  // Stores action output result for [Firestore Query - Query a collection] action in TextField widget.
  DestinationRecord? actualDestinationRec;
  // State field(s) for DestAddr1 widget.
  FocusNode? destAddr1FocusNode;
  TextEditingController? destAddr1TextController;
  String? Function(BuildContext, String?)? destAddr1TextControllerValidator;
  // State field(s) for DestAddr2 widget.
  FocusNode? destAddr2FocusNode;
  TextEditingController? destAddr2TextController;
  String? Function(BuildContext, String?)? destAddr2TextControllerValidator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode12;
  TextEditingController? textController19;
  String? Function(BuildContext, String?)? textController19Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode13;
  TextEditingController? textController20;
  String? Function(BuildContext, String?)? textController20Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode14;
  TextEditingController? textController21;
  String? Function(BuildContext, String?)? textController21Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode15;
  TextEditingController? textController22;
  String? Function(BuildContext, String?)? textController22Validator;
  // State field(s) for appttype widget.
  String? appttypeValue;
  FormFieldController<String>? appttypeValueController;
  // State field(s) for triptype widget.
  String? triptypeValue;
  FormFieldController<String>? triptypeValueController;
  // State field(s) for comments widget.
  FocusNode? commentsFocusNode;
  TextEditingController? commentsTextController;
  String? Function(BuildContext, String?)? commentsTextControllerValidator;
  // State field(s) for Checkbox widget.
  bool? checkboxValue5;
  // State field(s) for extridername widget.
  FocusNode? extridernameFocusNode;
  TextEditingController? extridernameTextController;
  String? Function(BuildContext, String?)? extridernameTextControllerValidator;
  // State field(s) for extriderrel widget.
  FocusNode? extriderrelFocusNode;
  TextEditingController? extriderrelTextController;
  String? Function(BuildContext, String?)? extriderrelTextControllerValidator;
  // State field(s) for recurring widget.
  String? recurringValue;
  FormFieldController<String>? recurringValueController;
  // Stores action output result for [Backend Call - API (createRideRequest)] action in Button widget.
  ApiCallResponse? apiResulttwp;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    dispatcherFocusNode?.dispose();
    dispatcherTextController?.dispose();

    textFieldFocusNode1?.dispose();

    textFieldFocusNode2?.dispose();
    textController3?.dispose();

    textFieldEmailaddressFocusNode?.dispose();
    textFieldEmailaddressTextController?.dispose();

    textFieldPrimaryphoneFocusNode?.dispose();
    textFieldPrimaryphoneTextController?.dispose();

    clientAddr1FocusNode?.dispose();
    clientAddr1TextController?.dispose();

    clientAddr2FocusNode?.dispose();
    clientAddr2TextController?.dispose();

    textFieldFocusNode3?.dispose();
    textController8?.dispose();

    textFieldFocusNode4?.dispose();
    textController9?.dispose();

    textFieldFocusNode5?.dispose();
    textController10?.dispose();

    textFieldFocusNode6?.dispose();
    textController11?.dispose();

    textFieldFocusNode7?.dispose();
    textController12?.dispose();

    textFieldFocusNode8?.dispose();
    textController13?.dispose();

    textFieldFocusNode9?.dispose();
    textController14?.dispose();

    textFieldFocusNode10?.dispose();
    textController15?.dispose();

    textFieldFocusNode11?.dispose();

    destAddr1FocusNode?.dispose();
    destAddr1TextController?.dispose();

    destAddr2FocusNode?.dispose();
    destAddr2TextController?.dispose();

    textFieldFocusNode12?.dispose();
    textController19?.dispose();

    textFieldFocusNode13?.dispose();
    textController20?.dispose();

    textFieldFocusNode14?.dispose();
    textController21?.dispose();

    textFieldFocusNode15?.dispose();
    textController22?.dispose();

    commentsFocusNode?.dispose();
    commentsTextController?.dispose();

    extridernameFocusNode?.dispose();
    extridernameTextController?.dispose();

    extriderrelFocusNode?.dispose();
    extriderrelTextController?.dispose();
  }
}
