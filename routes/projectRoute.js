const express = require("express")
const {newProject,updateProject, deleteProject, getProjectById, searchProjects, getAllProject} = require("../controllers/projectCtrl")
const requireAdmin = require("../middleware/adminRoles");
const validateToken = require("../middleware/validateAuth");


const router = express.Router()


// to get a project by Id
router.get("/getProject/:id", getProjectById);

router.get("/getAllProjects/:id", getAllProject,)

//create a new project
router.post("/newProject", validateToken, requireAdmin, newProject)

//find project and update by Id
router.put("/updateProject/:id", validateToken, updateProject);

// find project and delete by Id
router.delete("/deleteProject/:id", validateToken, deleteProject);

//search to get all available project
router.get("/searchProject", validateToken, searchProjects)



module.exports = router;
