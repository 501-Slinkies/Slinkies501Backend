import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'create_new_volunteer_type_model.dart';
export 'create_new_volunteer_type_model.dart';

class CreateNewVolunteerTypeWidget extends StatefulWidget {
  const CreateNewVolunteerTypeWidget({
    super.key,
    required this.deleteAction,
    required this.updateAction,
    this.initialValue,
  });

  final Future Function()? deleteAction;
  final Future Function(String initialValue)? updateAction;
  final String? initialValue;

  @override
  State<CreateNewVolunteerTypeWidget> createState() =>
      _CreateNewVolunteerTypeWidgetState();
}

class _CreateNewVolunteerTypeWidgetState
    extends State<CreateNewVolunteerTypeWidget> {
  late CreateNewVolunteerTypeModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CreateNewVolunteerTypeModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Hello World',
          style: FlutterFlowTheme.of(context).bodyMedium.override(
                font: GoogleFonts.inter(
                  fontWeight:
                      FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                  fontStyle: FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                ),
                letterSpacing: 0.0,
                fontWeight: FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                fontStyle: FlutterFlowTheme.of(context).bodyMedium.fontStyle,
              ),
        ),
        FlutterFlowIconButton(
          borderRadius: 8.0,
          buttonSize: 35.0,
          icon: Icon(
            Icons.delete_forever,
            color: Color(0xFFDD4E4E),
            size: 20.0,
          ),
          onPressed: () {
            print('IconButton pressed ...');
          },
        ),
      ],
    );
  }
}
