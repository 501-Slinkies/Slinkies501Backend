import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_checkbox_group.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/modals/create_user_date_invalid/create_user_date_invalid_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'create_new_user_widget.dart' show CreateNewUserWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class CreateNewUserModel extends FlutterFlowModel<CreateNewUserWidget> {
  ///  Local state fields for this component.
  /// Collection of dates for user availaility, in a string
  String availabilityString = '';

  OrganizationsRecord? getListOfMobility;

  ///  State fields for stateful widgets in this component.

  final formKey = GlobalKey<FormState>();
  // State field(s) for first-name-TextField widget.
  FocusNode? firstNameTextFieldFocusNode;
  TextEditingController? firstNameTextFieldTextController;
  String? Function(BuildContext, String?)?
      firstNameTextFieldTextControllerValidator;
  // State field(s) for lastname-TextField widget.
  FocusNode? lastnameTextFieldFocusNode;
  TextEditingController? lastnameTextFieldTextController;
  String? Function(BuildContext, String?)?
      lastnameTextFieldTextControllerValidator;
  // State field(s) for email-TextField widget.
  FocusNode? emailTextFieldFocusNode;
  TextEditingController? emailTextFieldTextController;
  String? Function(BuildContext, String?)?
      emailTextFieldTextControllerValidator;
  // State field(s) for phone-TextField widget.
  FocusNode? phoneTextFieldFocusNode;
  TextEditingController? phoneTextFieldTextController;
  String? Function(BuildContext, String?)?
      phoneTextFieldTextControllerValidator;
  String? _phoneTextFieldTextControllerValidator(
      BuildContext context, String? val) {
    if (val == null || val.isEmpty) {
      return 'Primary Phone is required';
    }

    if (val.length < 10) {
      return 'Must Be 10 characters long';
    }
    if (val.length > 10) {
      return 'Must Be 10 characters long';
    }

    return null;
  }

  // State field(s) for cell-Checkbox widget.
  bool? cellCheckboxValue;
  // State field(s) for addres1-TextField widget.
  FocusNode? addres1TextFieldFocusNode;
  TextEditingController? addres1TextFieldTextController;
  String? Function(BuildContext, String?)?
      addres1TextFieldTextControllerValidator;
  // State field(s) for address2-TextField widget.
  FocusNode? address2TextFieldFocusNode;
  TextEditingController? address2TextFieldTextController;
  String? Function(BuildContext, String?)?
      address2TextFieldTextControllerValidator;
  // State field(s) for zip-TextField widget.
  FocusNode? zipTextFieldFocusNode;
  TextEditingController? zipTextFieldTextController;
  String? Function(BuildContext, String?)? zipTextFieldTextControllerValidator;
  // State field(s) for city-TextField widget.
  FocusNode? cityTextFieldFocusNode;
  TextEditingController? cityTextFieldTextController;
  String? Function(BuildContext, String?)? cityTextFieldTextControllerValidator;
  // State field(s) for state-TextField widget.
  FocusNode? stateTextFieldFocusNode;
  TextEditingController? stateTextFieldTextController;
  String? Function(BuildContext, String?)?
      stateTextFieldTextControllerValidator;
  // State field(s) for secondaryphone-TextField widget.
  FocusNode? secondaryphoneTextFieldFocusNode;
  TextEditingController? secondaryphoneTextFieldTextController;
  String? Function(BuildContext, String?)?
      secondaryphoneTextFieldTextControllerValidator;
  // State field(s) for preferred-contact-DropDown widget.
  String? preferredContactDropDownValue;
  FormFieldController<String>? preferredContactDropDownValueController;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController10;
  String? Function(BuildContext, String?)? textController10Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController11;
  String? Function(BuildContext, String?)? textController11Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController12;
  String? Function(BuildContext, String?)? textController12Validator;
  // State field(s) for entered-date-TextField widget.
  FocusNode? enteredDateTextFieldFocusNode;
  TextEditingController? enteredDateTextFieldTextController;
  String? Function(BuildContext, String?)?
      enteredDateTextFieldTextControllerValidator;
  // State field(s) for when-trained-TextField widget.
  FocusNode? whenTrainedTextFieldFocusNode;
  TextEditingController? whenTrainedTextFieldTextController;
  String? Function(BuildContext, String?)?
      whenTrainedTextFieldTextControllerValidator;
  // State field(s) for when-oriented-TextField widget.
  FocusNode? whenOrientedTextFieldFocusNode;
  TextEditingController? whenOrientedTextFieldTextController;
  String? Function(BuildContext, String?)?
      whenOrientedTextFieldTextControllerValidator;
  // State field(s) for statusDropDown widget.
  String? statusDropDownValue;
  FormFieldController<String>? statusDropDownValueController;
  // State field(s) for security-DropDown widget.
  List<String>? securityDropDownValue;
  FormFieldController<List<String>>? securityDropDownValueController;
  // State field(s) for hear-DropDown widget.
  String? hearDropDownValue;
  FormFieldController<String>? hearDropDownValueController;
  // State field(s) for password-TextField widget.
  FocusNode? passwordTextFieldFocusNode;
  TextEditingController? passwordTextFieldTextController;
  late bool passwordTextFieldVisibility;
  String? Function(BuildContext, String?)?
      passwordTextFieldTextControllerValidator;
  // State field(s) for confirm-password-TextField widget.
  FocusNode? confirmPasswordTextFieldFocusNode;
  TextEditingController? confirmPasswordTextFieldTextController;
  late bool confirmPasswordTextFieldVisibility;
  String? Function(BuildContext, String?)?
      confirmPasswordTextFieldTextControllerValidator;
  // State field(s) for commentsTextField widget.
  FocusNode? commentsTextFieldFocusNode;
  TextEditingController? commentsTextFieldTextController;
  String? Function(BuildContext, String?)?
      commentsTextFieldTextControllerValidator;
  // State field(s) for vehicle-type-DropDown widget.
  String? vehicleTypeDropDownValue;
  FormFieldController<String>? vehicleTypeDropDownValueController;
  // State field(s) for vehicle-color-TextField widget.
  FocusNode? vehicleColorTextFieldFocusNode;
  TextEditingController? vehicleColorTextFieldTextController;
  String? Function(BuildContext, String?)?
      vehicleColorTextFieldTextControllerValidator;
  // State field(s) for maxrides-TextField widget.
  FocusNode? maxridesTextFieldFocusNode;
  TextEditingController? maxridesTextFieldTextController;
  String? Function(BuildContext, String?)?
      maxridesTextFieldTextControllerValidator;
  // State field(s) for mileage-reimb-Checkbox widget.
  bool? mileageReimbCheckboxValue;
  // State field(s) for town-pref-TextField widget.
  FocusNode? townPrefTextFieldFocusNode;
  TextEditingController? townPrefTextFieldTextController;
  String? Function(BuildContext, String?)?
      townPrefTextFieldTextControllerValidator;
  // State field(s) for destination-limits-TextField widget.
  FocusNode? destinationLimitsTextFieldFocusNode;
  TextEditingController? destinationLimitsTextFieldTextController;
  String? Function(BuildContext, String?)?
      destinationLimitsTextFieldTextControllerValidator;
  // State field(s) for getmobilitygroup widget.
  FormFieldController<List<String>>? getmobilitygroupValueController;
  List<String>? get getmobilitygroupValues =>
      getmobilitygroupValueController?.value;
  set getmobilitygroupValues(List<String>? v) =>
      getmobilitygroupValueController?.value = v;

  // State field(s) for oxygencheck widget.
  bool? oxygencheckValue;
  // State field(s) for accepts_service_animals widget.
  bool? acceptsServiceAnimalsValue;
  // State field(s) for service-animal-TextField widget.
  FocusNode? serviceAnimalTextFieldFocusNode;
  TextEditingController? serviceAnimalTextFieldTextController;
  String? Function(BuildContext, String?)?
      serviceAnimalTextFieldTextControllerValidator;
  // State field(s) for monday-is-available widget.
  bool? mondayIsAvailableValue;
  DateTime? datePicked1;
  DateTime? datePicked2;
  // State field(s) for tuesday-is-available widget.
  bool? tuesdayIsAvailableValue;
  DateTime? datePicked3;
  DateTime? datePicked4;
  // State field(s) for wednesday-is-available widget.
  bool? wednesdayIsAvailableValue;
  DateTime? datePicked5;
  DateTime? datePicked6;
  // State field(s) for thursday-is-available widget.
  bool? thursdayIsAvailableValue;
  DateTime? datePicked7;
  DateTime? datePicked8;
  // State field(s) for friday-is-available widget.
  bool? fridayIsAvailableValue;
  DateTime? datePicked9;
  DateTime? datePicked10;
  // State field(s) for saturday-is-available widget.
  bool? saturdayIsAvailableValue;
  DateTime? datePicked11;
  DateTime? datePicked12;
  // State field(s) for sunday-is-available widget.
  bool? sundayIsAvailableValue;
  DateTime? datePicked13;
  DateTime? datePicked14;

  @override
  void initState(BuildContext context) {
    phoneTextFieldTextControllerValidator =
        _phoneTextFieldTextControllerValidator;
    passwordTextFieldVisibility = false;
    confirmPasswordTextFieldVisibility = false;
  }

  @override
  void dispose() {
    firstNameTextFieldFocusNode?.dispose();
    firstNameTextFieldTextController?.dispose();

    lastnameTextFieldFocusNode?.dispose();
    lastnameTextFieldTextController?.dispose();

    emailTextFieldFocusNode?.dispose();
    emailTextFieldTextController?.dispose();

    phoneTextFieldFocusNode?.dispose();
    phoneTextFieldTextController?.dispose();

    addres1TextFieldFocusNode?.dispose();
    addres1TextFieldTextController?.dispose();

    address2TextFieldFocusNode?.dispose();
    address2TextFieldTextController?.dispose();

    zipTextFieldFocusNode?.dispose();
    zipTextFieldTextController?.dispose();

    cityTextFieldFocusNode?.dispose();
    cityTextFieldTextController?.dispose();

    stateTextFieldFocusNode?.dispose();
    stateTextFieldTextController?.dispose();

    secondaryphoneTextFieldFocusNode?.dispose();
    secondaryphoneTextFieldTextController?.dispose();

    textFieldFocusNode1?.dispose();
    textController10?.dispose();

    textFieldFocusNode2?.dispose();
    textController11?.dispose();

    textFieldFocusNode3?.dispose();
    textController12?.dispose();

    enteredDateTextFieldFocusNode?.dispose();
    enteredDateTextFieldTextController?.dispose();

    whenTrainedTextFieldFocusNode?.dispose();
    whenTrainedTextFieldTextController?.dispose();

    whenOrientedTextFieldFocusNode?.dispose();
    whenOrientedTextFieldTextController?.dispose();

    passwordTextFieldFocusNode?.dispose();
    passwordTextFieldTextController?.dispose();

    confirmPasswordTextFieldFocusNode?.dispose();
    confirmPasswordTextFieldTextController?.dispose();

    commentsTextFieldFocusNode?.dispose();
    commentsTextFieldTextController?.dispose();

    vehicleColorTextFieldFocusNode?.dispose();
    vehicleColorTextFieldTextController?.dispose();

    maxridesTextFieldFocusNode?.dispose();
    maxridesTextFieldTextController?.dispose();

    townPrefTextFieldFocusNode?.dispose();
    townPrefTextFieldTextController?.dispose();

    destinationLimitsTextFieldFocusNode?.dispose();
    destinationLimitsTextFieldTextController?.dispose();

    serviceAnimalTextFieldFocusNode?.dispose();
    serviceAnimalTextFieldTextController?.dispose();
  }
}
