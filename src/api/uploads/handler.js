class UploadsHandler {
  constructor(service, albumsService, validator) {
    this._service = service;
    this._validator = validator;
    this._albumsService = albumsService;

    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
  }

  async postUploadCoverHandler(request, h) {
    const { cover } = request.payload;
    const { albumId } = request.params;
    this._validator.validateImageCover(cover.hapi.headers);

    const filename = await this._service.writeFile(cover, cover.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/uploads/cover/${filename}`;

    await this._albumsService.addAlbumCover(fileLocation, albumId);

    const response = h.response({
      status: 'success',
      message: 'Cover berhasil ditambahkan',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;