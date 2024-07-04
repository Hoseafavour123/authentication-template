function arraysAreEqual(arr1, arr2) {
    // Check if the arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }
    
    // Check each element in the arrays
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true
}

export {
    arraysAreEqual
}