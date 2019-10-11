var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const validator = require('express-validator');
const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) return next(err);
            res.render('bookinstance_list', {
                title: 'Book Instance List',
                bookinstance_list: list_bookinstances
            });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) { // No results.
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('bookinstance_detail', {
                title: 'Copy: ' + bookinstance.book.title,
                bookinstance: bookinstance
            });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) {
                return next(err);
            }
            // Successful, so render.
            res.render('bookinstance_form', {
                title: 'Create BookInstance',
                book_list: books
            });
        });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    validator.body('book', 'Book must be specified').trim().isLength({
        min: 1
    }),
    validator.body('imprint', 'Imprint must be specified').trim().isLength({
        min: 1
    }),
    validator.body('due_back', 'Invalid date').optional({
        checkFalsy: true
    }).isISO8601(),

    // Sanitize fields.
    validator.sanitizeBody('book').escape(),
    validator.sanitizeBody('imprint').escape(),
    validator.sanitizeBody('status').trim().escape(),
    validator.sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    // Successful, so render.
                    res.render('bookinstance_form', {
                        title: 'Create BookInstance',
                        book_list: books,
                        errors: errors.array(),
                        bookinstance: bookinstance
                    });
                });
            return;
        } else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
    BookInstance.findById(req.params.id).populate('book').exec(function (err, instance) {
        if (err) return next(err);
        if (instance == null) res.redirect('/catalog/bookinstances')
        res.render('bookinstance_delete', {
            title: 'Delete Book Instance',
            instance: instance
        });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res) {
    BookInstance.findByIdAndDelete(req.params.id, function (err) {
        if (err) return next(err);
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
    async.parallel({
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id).exec(callback);
        },
        books: function (callback) {
            Book.find({}, 'title').exec(callback);
        },
    }, function (err, results) {
        if (err) return next(err);
        if (results.bookinstance == null) {
            const error = new Error('Instance couldn\'t be found');
            error.status(404);
            return next(error);
        }
        res.render('bookinstance_form', {
            title: 'Update Book Instance',
            bookinstance: results.bookinstance,
            book_list: results.books,
        });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    validator.body('title', 'Title must not be empty').trim().isLength({
        min: 1
    }),
    validator.body('imprint', 'Imprint must not be empty').trim().isLength({
        min: 1
    }),
    validator.body('status', 'Status must not be empty').trim().isLength({
        min: 1
    }),
    validator.body('due_back', 'Due back date must be a date').optional({
        isFalsy: true
    }).isISO8601(),

    validator.sanitizeBody('title').escape(),
    validator.sanitizeBody('imprint').escape(),
    validator.sanitizeBody('status').trim().escape(),
    validator.sanitizeBody('due_back').toDate(),

    function (req, res, next) {
        const errors = validator.validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec(function (err, book_list) {
                if(err) return next(err);
                res.render('bookinstance_form', {
                    title: 'Update Book Instance',
                    bookinstance: bookinstance,
                    book_list: book_list,
                    errors: errors.array(),
                });
            });
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, function (err) {
                if (err) return next(err);
                res.redirect(bookinstance.url);
            })
        }
    }
];