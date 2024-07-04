export default function asyncHandler(theFunc) {
  return (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
}
