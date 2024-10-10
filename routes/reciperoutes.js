const express = require('express');
const router = express.Router();
const recipeController = require('../controller/recipecontroller');

router.get('/recipes', recipeController.getAllRecipes);


router.post('/recipes', recipeController.addRecipe);


router.put('/recipes/:id', recipeController.updateRecipe);


router.delete('/recipes/:id', recipeController.deleteRecipe);

module.exports = router;
