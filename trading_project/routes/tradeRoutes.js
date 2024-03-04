const express = require('express');
const router = express.Router();
const {authenticated, isAuthor} = require('../middlewares/auth');
const {validateId} = require('../middlewares/validator'); 
const controller = require('../controllers/tradeController');

router.get('/', controller.index);

router.get('/new', authenticated, controller.new);

router.post('/', authenticated, controller.create);

router.get('/:id', authenticated,  controller.show);

router.get('/:id/edit', validateId, authenticated, isAuthor, controller.edit);

router.post('/:id/offer', validateId, authenticated, controller.offer);

router.post('/offer/:itemId/:id/accept', validateId, authenticated, controller.accept);

router.post('/offer/:itemId/:id/reject', validateId, authenticated, controller.reject);

router.put('/:id', validateId, authenticated, isAuthor, controller.update);

router.delete('/:id', validateId, authenticated, isAuthor, controller.delete);

router.post('/:id/watch/', validateId, authenticated, controller.addWatch);

router.delete('/:id/watch/:navigation', validateId, authenticated, controller.deleteWatch);

module.exports = router;  