import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_drop_down.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import 'dart:ui';
import '/index.dart';
import 'view_user_widget.dart' show ViewUserWidget;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ViewUserModel extends FlutterFlowModel<ViewUserWidget> {
  ///  Local state fields for this component.

  VolunteersRecord? viewUser;

  ///  State fields for stateful widgets in this component.

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
  // State field(s) for accepts_service_animals widget.
  bool? acceptsServiceAnimalsValue;
  // State field(s) for service-animal-TextField widget.
  FocusNode? serviceAnimalTextFieldFocusNode;
  TextEditingController? serviceAnimalTextFieldTextController;
  String? Function(BuildContext, String?)?
      serviceAnimalTextFieldTextControllerValidator;
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
  String? securityDropDownValue;
  FormFieldController<String>? securityDropDownValueController;
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
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController20;
  String? Function(BuildContext, String?)? textController20Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController21;
  String? Function(BuildContext, String?)? textController21Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController22;
  String? Function(BuildContext, String?)? textController22Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode4;
  TextEditingController? textController23;
  String? Function(BuildContext, String?)? textController23Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode5;
  TextEditingController? textController24;
  String? Function(BuildContext, String?)? textController24Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode6;
  TextEditingController? textController25;
  String? Function(BuildContext, String?)? textController25Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode7;
  TextEditingController? textController26;
  String? Function(BuildContext, String?)? textController26Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode8;
  TextEditingController? textController27;
  String? Function(BuildContext, String?)? textController27Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode9;
  TextEditingController? textController28;
  String? Function(BuildContext, String?)? textController28Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode10;
  TextEditingController? textController29;
  String? Function(BuildContext, String?)? textController29Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode11;
  TextEditingController? textController30;
  String? Function(BuildContext, String?)? textController30Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode12;
  TextEditingController? textController31;
  String? Function(BuildContext, String?)? textController31Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode13;
  TextEditingController? textController32;
  String? Function(BuildContext, String?)? textController32Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode14;
  TextEditingController? textController33;
  String? Function(BuildContext, String?)? textController33Validator;

  @override
  void initState(BuildContext context) {
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

    serviceAnimalTextFieldFocusNode?.dispose();
    serviceAnimalTextFieldTextController?.dispose();

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

    textFieldFocusNode1?.dispose();
    textController20?.dispose();

    textFieldFocusNode2?.dispose();
    textController21?.dispose();

    textFieldFocusNode3?.dispose();
    textController22?.dispose();

    textFieldFocusNode4?.dispose();
    textController23?.dispose();

    textFieldFocusNode5?.dispose();
    textController24?.dispose();

    textFieldFocusNode6?.dispose();
    textController25?.dispose();

    textFieldFocusNode7?.dispose();
    textController26?.dispose();

    textFieldFocusNode8?.dispose();
    textController27?.dispose();

    textFieldFocusNode9?.dispose();
    textController28?.dispose();

    textFieldFocusNode10?.dispose();
    textController29?.dispose();

    textFieldFocusNode11?.dispose();
    textController30?.dispose();

    textFieldFocusNode12?.dispose();
    textController31?.dispose();

    textFieldFocusNode13?.dispose();
    textController32?.dispose();

    textFieldFocusNode14?.dispose();
    textController33?.dispose();
  }
}
