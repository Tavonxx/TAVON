# Legacy fix — PP Space 2.0 overwrite bug (R1)

สถานะ: ✅ ใส่ในลิงก์จริงแล้ว 23 พ.ย. 2026 (artifact version `1795480102-0293`, ก่อนหน้า `1792245900-f3a5`)

## ก่อน (บั๊ก): ถ้า version ไม่ตรง → เขียนทับข้อมูลงานด้วยข้อมูลตัวอย่าง
```js
if(localStorage.getItem('pee-work-tracker-version')!==dataVersion){data=excelData();localStorage.setItem('pee-work-tracker',JSON.stringify(data));localStorage.setItem('pee-work-tracker-version',dataVersion)}else data=JSON.parse(localStorage.getItem('pee-work-tracker')||'{}');
```
## หลัง: มีข้อมูลอยู่แล้ว = ใช้ข้อมูลเดิมเสมอ · ใส่ข้อมูลเริ่มต้นเฉพาะเครื่องที่ว่างจริง ๆ
```js
{let saved=null;try{saved=JSON.parse(localStorage.getItem('pee-work-tracker')||'null')}catch(e){saved=null}if(saved&&typeof saved==='object'&&!Array.isArray(saved)){data=saved}else if(localStorage.getItem('pee-work-tracker')===null){data=excelData();localStorage.setItem('pee-work-tracker',JSON.stringify(data))}else{data={}}if(localStorage.getItem('pee-work-tracker-version')!==dataVersion)localStorage.setItem('pee-work-tracker-version',dataVersion)}
```
## ผลทดสอบ (browser จริง)
| กรณี | เดิม | แก้แล้ว |
|---|---|---|
| import backup เวอร์ชันเก่า | ❌ ข้อมูลหาย | ✅ คงอยู่ |
| ไม่มี version marker | ❌ ข้อมูลหาย | ✅ คงอยู่ |
| เครื่องใหม่ว่างเปล่า | ใส่ข้อมูลเริ่มต้น | เหมือนเดิม |
