const pool = require('../database');


const getAllRecipes = async (req, res) => {
    try {
        const recipeQuery = 'SELECT * FROM recipe';
        const recipes = await pool.query(recipeQuery);

        const recipeData = await Promise.all(
            recipes.rows.map(async (recipe) => {
                const ingredientsQuery = 'SELECT * FROM ingredients WHERE recipe_id = $1';
                const stepsQuery = 'SELECT * FROM steps WHERE recipe_id = $1';

                const ingredients = await pool.query(ingredientsQuery, [recipe.id]);
                const steps = await pool.query(stepsQuery, [recipe.id]);

                return {
                    ...recipe,
                    ingredients: ingredients.rows,
                    steps: steps.rows,
                };
            })
        );

        res.json(recipeData);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const addRecipe = async (req, res) => {
    const { name, description, icon, ingredients, steps } = req.body;

    if (!name || !ingredients || !steps) {
        return res.status(400).json({ message: 'Name, ingredients, and steps are required' });
    }

    try {
        
        const recipeQuery = `
            INSERT INTO recipe (name, description, icon, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`;
        const recipeResult = await pool.query(recipeQuery, [name, description || null, icon || null]);

        const recipeId = recipeResult.rows[0].id;

        
        const ingredientPromises = ingredients.map((ingredient) => {
            return pool.query(
                'INSERT INTO ingredients (recipe_id, name, icon, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [recipeId, ingredient.name, ingredient.icon || null]
            );
        });

        
        const stepPromises = steps.map((step) => {
            return pool.query(
                'INSERT INTO steps (recipe_id, title, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [recipeId, step.title, step.description]
            );
        });

        await Promise.all([...ingredientPromises, ...stepPromises]);

        res.status(201).json({
            message: 'Recipe created successfully',
            recipe: recipeResult.rows[0],
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateRecipe = async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, ingredients, steps } = req.body;

    try {
        
        const updateRecipeQuery = `
            UPDATE recipe SET name = $1, description = $2, icon = $3, updated_at = NOW()
            WHERE id = $4 RETURNING *`;
        const updatedRecipe = await pool.query(updateRecipeQuery, [name, description || null, icon || null, id]);

        if (updatedRecipe.rows.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        
        await pool.query('DELETE FROM ingredients WHERE recipe_id = $1', [id]);
        await pool.query('DELETE FROM steps WHERE recipe_id = $1', [id]);

        const ingredientPromises = ingredients.map((ingredient) => {
            return pool.query(
                'INSERT INTO ingredients (recipe_id, name, icon, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [id, ingredient.name, ingredient.icon || null]
            );
        });

        const stepPromises = steps.map((step) => {
            return pool.query(
                'INSERT INTO steps (recipe_id, title, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [id, step.title, step.description]
            );
        });

        await Promise.all([...ingredientPromises, ...stepPromises]);

        res.json({
            message: 'Recipe updated successfully',
            recipe: updatedRecipe.rows[0],
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const deleteRecipe = async (req, res) => {
    const { id } = req.params;

    try {
        
        await pool.query('DELETE FROM ingredients WHERE recipe_id = $1', [id]);
        await pool.query('DELETE FROM steps WHERE recipe_id = $1', [id]);

        
        const deleteRecipeQuery = 'DELETE FROM recipe WHERE id = $1 RETURNING *';
        const result = await pool.query(deleteRecipeQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllRecipes, addRecipe, updateRecipe, deleteRecipe };
