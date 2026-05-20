import { can } from "../security/policy.js";

export const authorize = (action) => {
    
    return(req, res, next) => {

        if(!req.auth){
            return res.status(401).json({
                message : "unauthorized"
            });
        }
        console.log("req.auth :: ", req.auth);
        console.log("action :: ", action);

        
        const decision = can(req.auth, action);
        if(!decision.allowed){
            return res.status(403).json({
                message : "Forbidden"
            });
        }
        next();
    };
};