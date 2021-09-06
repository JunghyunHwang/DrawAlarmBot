'use strict';
const schedule = require('node-schedule');
const DB = require('./config/db.js');
const NikeDraw = require('./brands/NikeDraw');
const logging = require('./log');

const Nike = new NikeDraw("Nike", "https://www.nike.com/kr/launch/");
let brands = [];
brands.push(Nike);

function insertNewProducts(newProducts) {
	const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";

	for (let product of newProducts) {
		DB.query(INSERT_PRODUCT_SQL, {
			brand_name: product.brand_name,
			type_name: product.type_name,
			sneakers_name: product.sneakers_name,
			full_name: product.full_name,
			product_price: product.price,
			product_url: product.url,
			draw_date: product.draw_date,
			draw_start_time: product.draw_start_time,
			draw_end_time: product.draw_end_time,
			winner_announcement_time: product.announcement_time,
			purchase_time: product.purchase_time,
			img_url: product.img_url
		}, (err, inserResult) => {
			if (err) {
				console.log(err); // re exception
				logging('error', 'Draw 추가 실패');
			}
			else {
				console.log("새로운 Draw 저장 완료!!");
				logging('info', `${product.full_name} 추가`);
			}
		});
	}
}

function checkDrawDatas(brand) {
	let newDrawList = [];
	const DRAW_INFO_SQL = "SELECT full_name FROM draw_info WHERE brand_name=?";

	DB.query(DRAW_INFO_SQL, [brand.name], async (err, drawDatas) => {
		if (err) {
			console.log(err);
		}
		else {
			for (let sneakers of brand.drawList) {
				let isNewDraw = true;
				
				for (let data of drawDatas) {
					if (data.full_name === sneakers.full_name) {
						isNewDraw = false;
						break;
					}
				}

				if (isNewDraw) {
					newDrawList.push(sneakers);
				}
			}

			if (newDrawList.length > 0) {
				insertNewProducts(await brand.getSneakersInfo(newDrawList));
			}
			else {
				console.log("저장 할게 없어");
			}
		}
	});
}

let checkNewDrawsEveryMinutes = schedule.scheduleJob('0 * * * * *', async () => {
  	let startTime = new Date();
  
	for (let brand of brands) {
		let drawList = await brand.getDrawList();

		if (drawList.length == 0) {
			continue;
		}

    	const NUMBER_OF_DRAW_DATA_SQL = "SELECT COUNT(*) FROM draw_info WHERE brand_name=?";
		DB.query(NUMBER_OF_DRAW_DATA_SQL, [brand.name], async (err, drawData) => {
			if (err) {
				console.log(err);
			}
			else if (drawList.length != drawData[0]['COUNT(*)']) {
				if (drawData[0]['COUNT(*)'] == 0) {
					insertNewProducts(await brand.getSneakersInfo(drawList));
				}
				else if (drawData[0]['COUNT(*)'] > drawList.length) {
					logging('error', 'DB 삭제 안됐을 가능성있음 info log 확인');
				}
				else {
					checkDrawDatas(brand);
				}
			}
			else {
				let endTime = new Date();
				let resultTime = (endTime - startTime) / 1000;
				console.log(`${resultTime}초 걸림!`);
				console.log("Nothing changed");
				console.log("---------------");
			}
		});
	}
});