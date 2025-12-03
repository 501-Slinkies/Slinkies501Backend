import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'get_permission_roles_widget.dart' show GetPermissionRolesWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class GetPermissionRolesModel
    extends FlutterFlowModel<GetPermissionRolesWidget> {
  ///  Local state fields for this component.

  String roleName = '\"\"';

  ///  State fields for stateful widgets in this component.

  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;
  // Stores action output result for [Backend Call - API (updateRolePermissions)] action in Button widget.
  ApiCallResponse? apiResult3w8;
  // Stores action output result for [Backend Call - API (updateRole)] action in Button widget.
  ApiCallResponse? apiResultzfx;
  // State field(s) for CreateClient widget.
  bool? createClientValue;
  // State field(s) for ReadClient widget.
  bool? readClientValue;
  // State field(s) for UpdateClient widget.
  bool? updateClientValue;
  // State field(s) for DeleteClient widget.
  bool? deleteClientValue;
  // State field(s) for CreateRIDE widget.
  bool? createRIDEValue;
  // State field(s) for ReadRide widget.
  bool? readRideValue;
  // State field(s) for UpdateRide widget.
  bool? updateRideValue;
  // State field(s) for DeleteRide widget.
  bool? deleteRideValue;
  // State field(s) for CreateRole widget.
  bool? createRoleValue;
  // State field(s) for ReadRole widget.
  bool? readRoleValue;
  // State field(s) for UpdateRole widget.
  bool? updateRoleValue;
  // State field(s) for CreateVolunteer widget.
  bool? createVolunteerValue;
  // State field(s) for ReadVolunteer widget.
  bool? readVolunteerValue;
  // State field(s) for UpdateVolunteer widget.
  bool? updateVolunteerValue;
  // State field(s) for DeleteVolunteer widget.
  bool? deleteVolunteerValue;
  // State field(s) for CreateOrg widget.
  bool? createOrgValue;
  // State field(s) for ReadOrg widget.
  bool? readOrgValue;
  // State field(s) for UpdateOrg widget.
  bool? updateOrgValue;
  // State field(s) for DeleteOrg widget.
  bool? deleteOrgValue;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldFocusNode?.dispose();
    textController?.dispose();
  }
}
