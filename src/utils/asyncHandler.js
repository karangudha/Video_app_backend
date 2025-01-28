const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}


export { asyncHandler }


// const asyncHandler = (Fn) => async (req, res, next) =>  {
//     try {
//         await Fn(req, res, next);
//     }
//     catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }