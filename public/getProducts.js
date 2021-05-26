'use strict';

const test = async () => {
    const fetchApi = '/api/get/draw_info';
    const response = await fetch(fetchApi);
    console.log(response);
}
// async function test() {
//     const fetchApi = '/api/get/draw_info';
//     const response = await fetch(fetchApi);

//     console.log(response);
// }