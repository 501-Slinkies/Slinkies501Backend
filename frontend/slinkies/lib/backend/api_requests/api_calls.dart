import 'dart:convert';
import 'dart:typed_data';
import '../schema/structs/index.dart';

import 'package:flutter/foundation.dart';

import '/flutter_flow/flutter_flow_util.dart';
import 'api_manager.dart';

export 'api_manager.dart' show ApiCallResponse;

const _kPrivateApiFunctionName = 'ffPrivateApiCall';

class GetAvailableDriverCall {
  static Future<ApiCallResponse> call({
    String? rideId = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getAvailableDriver',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/rides/${rideId}/match-drivers',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static String? rideId(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.ride.id''',
      ));
  static int? rideDuration(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$.ride.estimatedDuration''',
      ));
  static String? tripType(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.ride.tripType''',
      ));
  static List? availableDriversList(dynamic response) => getJsonField(
        response,
        r'''$.available''',
        true,
      ) as List?;
  static int? numAvailDrivers(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$.summary.availableCount''',
      ));
  static int? numTotalDrivers(dynamic response) => castToType<int>(getJsonField(
        response,
        r'''$.summary.totalDrivers''',
      ));
  static int? numUnavailDrivers(dynamic response) =>
      castToType<int>(getJsonField(
        response,
        r'''$.summary.unavailableCount''',
      ));
}

class GetReportCall {
  static Future<ApiCallResponse> call({
    String? documentId = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getReport',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/reports',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'document_id': documentId,
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UpdateRideCall {
  static Future<ApiCallResponse> call({
    String? appointmentTime = '',
    String? appointmentType = '',
    String? estimatedDuration = '',
    String? tripType = '',
    String? status = '',
    String? externalComment = '',
    String? date = '',
    String? rideId = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "Date": "${escapeStringForJson(date)}",
  "appointmentTime": "${escapeStringForJson(appointmentTime)}",
  "appointment_type": "${escapeStringForJson(appointmentType)}",
  "pickupTme": "<pickupTme>",
  "estimatedDuration": "${escapeStringForJson(estimatedDuration)}",
  "purpose": "<purpose>",
  "tripType": "${escapeStringForJson(tripType)}",
  "status": "${escapeStringForJson(status)}",
  "externalComment": "${escapeStringForJson(externalComment)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'updateRide',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/rides/${rideId}',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class PostReportTypeCall {
  static Future<ApiCallResponse> call({
    List<String>? selectedParamsList,
    String? collection = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final selectedParams = _serializeList(selectedParamsList);

    final ffApiRequestBody = '''
{
  "collection": "${escapeStringForJson(collection)}",
  "selectedParams": ${selectedParams}
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'postReportType',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/reports',
      callType: ApiCallType.POST,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class PostLoginCall {
  static Future<ApiCallResponse> call({
    String? username = '',
    String? password = '',
    List<String>? roleList,
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final role = _serializeList(roleList);

    final ffApiRequestBody = '''
{
  "username": "${escapeStringForJson(username)}",
  "password": "${escapeStringForJson(password)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'postLogin',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/login/',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static String? email(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.user.email''',
      ));
  static String? userID(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.user.userId''',
      ));
  static String? orgID(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.user.organizationId''',
      ));
  static String? password(dynamic response) => castToType<String>(getJsonField(
        response,
        r'''$.token''',
      ));
}

class GetOrgsCall {
  static Future<ApiCallResponse> call({
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getOrgs',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/organizations',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UpdateUnavailabilityCall {
  static Future<ApiCallResponse> call({
    String? volunteerId = '',
    bool? repeated,
    String? unavailabilityString = '',
    String? effectiveFrom = '',
    String? effectiveTo = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "entries": [
    {
      "repeated": ${repeated},
      "unavailabilityString": "${escapeStringForJson(unavailabilityString)}",
      "effectiveFrom": "${escapeStringForJson(effectiveFrom)}",
      "effectiveTo": "${escapeStringForJson(effectiveTo)}"
    }
  ]
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'updateUnavailability',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/volunteers/${volunteerId}/unavailability',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class GetCalendarInfoCall {
  static Future<ApiCallResponse> call({
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getCalendarInfo',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/rides/calendar',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List? rideDispatcherLN(dynamic response) => getJsonField(
        response,
        r'''$.rides[:].dispatcherLastName''',
        true,
      ) as List?;
  static List<String>? rideClientLN(dynamic response) => (getJsonField(
        response,
        r'''$.rides[:].clientLastName''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List? rideDriverLN(dynamic response) => getJsonField(
        response,
        r'''$.rides[:].driverLastName''',
        true,
      ) as List?;
  static List<String>? rideDate(dynamic response) => (getJsonField(
        response,
        r'''$.rides[:].date''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List<String>? ridePickupTime(dynamic response) => (getJsonField(
        response,
        r'''$.rides[:].pickupTime''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List<String>? rideId(dynamic response) => (getJsonField(
        response,
        r'''$.rides[:].ride_id''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List? ridesList(dynamic response) => getJsonField(
        response,
        r'''$.rides''',
        true,
      ) as List?;
  static List<String>? status(dynamic response) => (getJsonField(
        response,
        r'''$.rides[:].status''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
}

class GetMobilityDropDownCall {
  static Future<ApiCallResponse> call({
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getMobilityDropDown',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/organizations',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'field': "type_of_mobility",
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List<String>? getMobilityType(dynamic response) => (getJsonField(
        response,
        r'''$.organizations[:].type_of_mobility''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List<String>? getVolunteerType(dynamic response) => (getJsonField(
        response,
        r'''$.organizations[:].type_of_volunteering''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
}

class GetRolesCall {
  static Future<ApiCallResponse> call({
    String? orgId = 'bripen',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getRoles',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/organizations/${orgId}/roles',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List<String>? getRoleName(dynamic response) => (getJsonField(
        response,
        r'''$.roles[:].name''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List<String>? roleView(dynamic response) => (getJsonField(
        response,
        r'''$.roles[:].view''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
  static List? roles(dynamic response) => getJsonField(
        response,
        r'''$.roles''',
        true,
      ) as List?;
  static List<String>? parentRole(dynamic response) => (getJsonField(
        response,
        r'''$.roles[:].parentRole''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
}

class GetParentRoleCall {
  static Future<ApiCallResponse> call({
    String? roleSelected = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getParentRole',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/roles/${roleSelected}/parent',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static String? parentRole(dynamic response) =>
      castToType<String>(getJsonField(
        response,
        r'''$.parentRole''',
      ));
}

class PostRolesCall {
  static Future<ApiCallResponse> call({
    String? name = '',
    String? orgId = '',
    String? id = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "name": "${escapeStringForJson(name)}",
  "org_id": "${escapeStringForJson(orgId)}",
  "parentRole": "${escapeStringForJson(id)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'postRoles',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/roles',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class GetRolesPermissionsCall {
  static Future<ApiCallResponse> call({
    String? roleName = '\"\"',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getRolesPermissions',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/roles/${roleName}/permission-set',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'org_id': "\"\"",
        'roles': "roles",
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static bool? getCreateOrg(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.create_org''',
      ));
  static bool? getReadOrg(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_org''',
      ));
  static bool? getUpdateOrg(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.update_org''',
      ));
  static bool? getDeleteOrg(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.delete_org''',
      ));
  static bool? getDeleteRole(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.delete_role''',
      ));
  static bool? getUpdateRole(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.update_role''',
      ));
  static bool? getReadRoles(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_role''',
      ));
  static bool? getCreateRoles(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.create_role''',
      ));
  static bool? getReadLogs(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_logs''',
      ));
  static bool? getCreateClient(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.create_client''',
      ));
  static bool? getReadClient(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_client''',
      ));
  static bool? getUpdateClient(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.update_client''',
      ));
  static bool? getDeleteClient(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.delete_client''',
      ));
  static bool? getCreateVolunteer(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.create_volunteer''',
      ));
  static bool? getReadVolunteer(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_volunteer''',
      ));
  static bool? getUpdateVolunteer(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.update_volunteer''',
      ));
  static bool? getDeleteVolunteer(dynamic response) =>
      castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.delete_volunteer''',
      ));
  static bool? getCreateRide(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.create_ride''',
      ));
  static bool? getReadRide(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.read_ride''',
      ));
  static bool? getUpdateRide(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.update_ride''',
      ));
  static bool? getDeleteRide(dynamic response) => castToType<bool>(getJsonField(
        response,
        r'''$.permissionSet.delete_ride''',
      ));
  static String? getRoleName(dynamic response) =>
      castToType<String>(getJsonField(
        response,
        r'''$.role.name''',
      ));
}

class GetDriverAssignedRidesCall {
  static Future<ApiCallResponse> call({
    String? driverID = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getDriverAssignedRides',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/drivers/{driverID}/rides',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List? rides(dynamic response) => getJsonField(
        response,
        r'''$.data.rides''',
        true,
      ) as List?;
}

class AddImageRecordCall {
  static Future<ApiCallResponse> call({
    FFUploadedFile? photo,
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Add image Record',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/organizations',
      callType: ApiCallType.POST,
      headers: {},
      params: {
        'photo': photo,
      },
      bodyType: BodyType.MULTIPART,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List<String>? uploadimage(dynamic response) => (getJsonField(
        response,
        r'''$.organizations[:].image''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
}

class StoreImageRecordCall {
  static Future<ApiCallResponse> call({
    FFUploadedFile? photo,
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Store image Record',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/organizations/{image}',
      callType: ApiCallType.POST,
      headers: {},
      params: {
        'photo': photo,
      },
      bodyType: BodyType.MULTIPART,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }

  static List<String>? uploadimage(dynamic response) => (getJsonField(
        response,
        r'''$.organizations[:].image''',
        true,
      ) as List?)
          ?.withoutNulls
          .map((x) => castToType<String>(x))
          .withoutNulls
          .toList();
}

class GetUnavailabilityCall {
  static Future<ApiCallResponse> call({
    String? volunteerId = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'getUnavailability',
      apiUrl:
          'https://axo-lift.webdev.gccis.rit.edu/api/volunteers/${volunteerId}/unavailability',
      callType: ApiCallType.GET,
      headers: {},
      params: {},
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class PostExportsCall {
  static Future<ApiCallResponse> call({
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "collection": "clients",
  "format": "csv",
  "fields": "first_name",
  "pageSize": 10,
  "org": "bripen"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'postExports',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/exports',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class SetDriverCall {
  static Future<ApiCallResponse> call({
    String? driverId = '',
    String? rideId = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "driverId": "${escapeStringForJson(driverId)}",
  "rideId": "${escapeStringForJson(rideId)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'setDriver',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/rides/set-driver',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class CreateOrgCall {
  static Future<ApiCallResponse> call({
    String? shortName = '',
    String? name = '',
    String? orgId = '',
    String? address = '',
    String? email = '',
    String? phoneNumber = '',
    String? website = '',
    String? creationDate = '',
    String? address2 = '',
    String? city = '',
    String? state = '',
    String? zip = '',
    String? pcName = '',
    String? pcPhoneNumber = '',
    String? pcEmail = '',
    String? pcAddress = '',
    String? pcAddress2 = '',
    String? pcCity = '',
    String? pcState = '',
    String? pcZip = '',
    String? scName = '',
    String? scPhoneNumber = '',
    String? scEmail = '',
    String? scAddress = '',
    String? scAddress2 = '',
    String? scCity = '',
    String? scState = '',
    String? scZip = '',
    String? scSecurityRole = '',
    String? scToken = '',
    String? pcSeurityRole = '',
    String? pcToken = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "short_name": "${escapeStringForJson(shortName)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'createOrg',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/organizations',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class CreateRideRequestCall {
  static Future<ApiCallResponse> call({
    String? clientUID = '',
    String? date = '',
    String? appointmentTime = '',
    String? appointmentType = '',
    String? purpose = '',
    String? status = '',
    String? tripType = '',
    String? recurring = '',
    String? driverUID = '',
    String? dispatcherUID = '',
    String? destinationUID = '',
    String? organization = '',
    String? pickupTime = '',
    int? estimatedDuration,
    int? milesDriven,
    int? volunteerHours,
    String? donationRecieved = '',
    int? donationAmount,
    String? internalComment = '',
    String? externalComment = '',
    String? startLocation = '',
    String? endLocation = '',
    String? additionalClient1Name = '',
    String? additionalClient1Rel = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
"clientUID": "${clientUID}",
"Date": "${date}",
"appointmentTime": "${appointmentTime}",
"appointment_type": "${appointmentType}",
"purpose": "${purpose}",
"status": "${status}",
"tripType": "${tripType}",
"recurring": "${recurring}",
"driverUID": "${driverUID}",
"dispatcherUID":"${dispatcherUID}",
"destinationUID": "${destinationUID}",
"organization": "${organization}",
"pickupTime": "${pickupTime}",
"estimatedDuration": ${estimatedDuration},
"milesDriven": ${milesDriven},
"volunteerHours": ${volunteerHours},
"donationRecieved": "${donationRecieved}",
"donationAmount": ${donationAmount},
"internalComment": "${internalComment}",
"externalComment": "${internalComment}",
"startLocation": "${startLocation}",
"endLocation": "${endLocation}",
"additionalClient1_Name":"${additionalClient1Name}",
"additionalClient1_Rel":"${additionalClient1Rel}"       
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'createRideRequest',
      apiUrl: 'https://axo-lift.webdeb.gccis.rit.edu/api/rides',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.TEXT,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class AssignDriverCall {
  static Future<ApiCallResponse> call({
    String? driverId = '',
    String? rideIds = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "driverId": "${escapeStringForJson(driverId)}",
  "rideIds": "${escapeStringForJson(rideIds)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'Assign Driver',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/rides/assign-driver',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UpdateRoleCall {
  static Future<ApiCallResponse> call({
    String? name = '',
    String? id = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "name": "${escapeStringForJson(name)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'updateRole',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/roles/${id}',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class UpdateRolePermissionsCall {
  static Future<ApiCallResponse> call({
    String? roleName = '',
    bool? createClient,
    bool? readClient,
    bool? updateClient,
    bool? deleteClient,
    bool? createOrg,
    bool? readOrg,
    bool? updateOrg,
    bool? deleteOrg,
    bool? createRide,
    bool? readRide,
    bool? updateRide,
    bool? deleteRide,
    bool? createRole,
    bool? readRole,
    bool? updateRole,
    bool? deleteRole,
    bool? createVolunteer,
    bool? readVolunteer,
    bool? updateVolunteer,
    bool? deleteVolunteer,
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "roleName": "${escapeStringForJson(roleName)}",
  "create_client": ${createClient},
  "read_client": ${readClient},
  "update_client": ${updateClient},
  "delete_client": ${deleteClient},
  "create_org": ${createOrg},
  "read_org": ${readOrg},
  "update_org": ${updateOrg},
  "delete_org": ${deleteOrg},
  "create_ride": ${createRide},
  "read_ride": ${readRide},
  "update_ride": ${updateRide},
  "delete_ride": ${deleteRide},
  "create_role": ${createRole},
  "read_role": ${readRole},
  "update_role": ${updateRole},
  "delete_role": ${deleteRole},
  "create_volunteer": ${createVolunteer},
  "read_volunteer": ${readVolunteer},
  "update_volunteer": ${updateVolunteer},
  "delete_volunteer": ${deleteVolunteer}
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'updateRolePermissions',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/permissions',
      callType: ApiCallType.PUT,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class CompleteRidesCall {
  static Future<ApiCallResponse> call({
    String? rideCompletions = '',
    String? orgId = '',
    String? signedinRoleName = '',
  }) async {
    final ffApiRequestBody = '''
{
  "rideCompletions": "${escapeStringForJson(rideCompletions)}"
}''';
    return ApiManager.instance.makeApiCall(
      callName: 'Complete rides',
      apiUrl: 'https://axo-lift.webdev.gccis.rit.edu/api/rides/complete',
      callType: ApiCallType.POST,
      headers: {},
      params: {},
      body: ffApiRequestBody,
      bodyType: BodyType.JSON,
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
      isStreamingApi: false,
      alwaysAllowBody: false,
    );
  }
}

class ApiPagingParams {
  int nextPageNumber = 0;
  int numItems = 0;
  dynamic lastResponse;

  ApiPagingParams({
    required this.nextPageNumber,
    required this.numItems,
    required this.lastResponse,
  });

  @override
  String toString() =>
      'PagingParams(nextPageNumber: $nextPageNumber, numItems: $numItems, lastResponse: $lastResponse,)';
}

String _toEncodable(dynamic item) {
  if (item is DocumentReference) {
    return item.path;
  }
  return item;
}

String _serializeList(List? list) {
  list ??= <String>[];
  try {
    return json.encode(list, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("List serialization failed. Returning empty list.");
    }
    return '[]';
  }
}

String _serializeJson(dynamic jsonVar, [bool isList = false]) {
  jsonVar ??= (isList ? [] : {});
  try {
    return json.encode(jsonVar, toEncodable: _toEncodable);
  } catch (_) {
    if (kDebugMode) {
      print("Json serialization failed. Returning empty json.");
    }
    return isList ? '[]' : '{}';
  }
}

String? escapeStringForJson(String? input) {
  if (input == null) {
    return null;
  }
  return input
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"')
      .replaceAll('\n', '\\n')
      .replaceAll('\t', '\\t');
}
