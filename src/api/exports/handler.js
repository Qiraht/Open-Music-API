const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(service, validator, authorization) {
    this._service = service;
    this._validator = validator;
    this._authorization = authorization;

    autoBind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    // Check if playlist is authorized

    await this._authorization.verifyPlaylistOwner(playlistId, credentialId);
    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };


    await this._service.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;