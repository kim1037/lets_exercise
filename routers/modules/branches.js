const router = require('express').Router()
const branchController = require('../../controllers/branch-controller')

router.get('/all', branchController.getAll) // get all branches
router.get('/:branchId', branchController.getBranch) // get a branch

module.exports = router
