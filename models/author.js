const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function() {
    return this.family_name + ', ' + this.first_name;
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Virtual for authors lifespan
AuthorSchema
.virtual('lifespan')
.get(function() {
    const date_of_birth = this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do, YYYY') : '';
    const date_of_death = this.date_of_death ? moment(this.date_of_death).format('MMMM Do, YYYY') : '';

    if(date_of_birth)
        return date_of_birth + ' - ' + date_of_death;
    else if(date_of_death) 
        return '(?) - ' + date_of_death;
    else 
        return '';
});

// Export model
module.exports = mongoose.model('Author', AuthorSchema);