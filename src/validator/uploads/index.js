const InvariantError = require('../../exceptions/InvariantError');
const { ImageCoverSchema } = require('./schema');

const UploadsValidator = {
  validateImageCover: (cover) => {
    const validationResult = ImageCoverSchema.validate(cover);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;