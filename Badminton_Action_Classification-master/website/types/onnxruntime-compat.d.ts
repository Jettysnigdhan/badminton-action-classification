// ONNX Runtime exposes int64 tensors as BigInt64Array in browsers. This alias
// keeps its tensor union compatible with the TypeScript DOM library version used here.
type Int64Array = BigInt64Array;
