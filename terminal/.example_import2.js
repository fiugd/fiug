console.log('import happened');

export const sleep = (time) => new Promise((resolve)=> setTimeout(() => resolve('done'), time) );
