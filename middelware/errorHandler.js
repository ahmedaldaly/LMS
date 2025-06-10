
const errorHandler = async(err ,req , res ,next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode).json({
        message:err.message,
        stack:process.env.NODE_ENV === 'production' ? null : err.stack,
    })

}

const notFound =async (req , res ,next)=> {
    const error = new error(`not found - ${req.originalUrl}`)
    res.status(404)
    next(error)

}

module.exports = {errorHandler , notFound}
