import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'donations_recieved_text_field_widget.dart'
    show DonationsRecievedTextFieldWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class DonationsRecievedTextFieldModel
    extends FlutterFlowModel<DonationsRecievedTextFieldWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for donationsRecieved widget.
  FocusNode? donationsRecievedFocusNode;
  TextEditingController? donationsRecievedTextController;
  String? Function(BuildContext, String?)?
      donationsRecievedTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    donationsRecievedFocusNode?.dispose();
    donationsRecievedTextController?.dispose();
  }
}
