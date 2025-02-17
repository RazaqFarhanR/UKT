const models = require('../../models/index');
const soal = models.soal;
const lembar_soal = models.lembar_soal;
const session = models.session;
const { Sequelize, Op } = require("sequelize");

module.exports = {
    controllerGetAll: async (req, res) => {
        session.findAll()
            .then(session => {
                res.json({
                    count: session.length,
                    data: session
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerGetTotalPage: async (req, res) => {
        const limit = Number(req.params.limit);
        session.findAll({
            where: {
                id_event: req.params.id
            },
            attributes: ['id_session']
        })
            .then(result => {
                const totalPages = Math.ceil(result.length / limit);
                res.json({ totalPages });
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerGetByEvent: async (req, res) => {
        const { id, page, limit } = req.params;
        const pageNumber = Number(page);
        const itemsPerPage = Number(limit);

        const offset = (pageNumber - 1) * itemsPerPage;

        session.findAll({
            where: {
                id_event: id
            },
            include: [
                {
                    model: models.siswa,
                    attributes: ['name', 'nomor_urut'],
                    as: "keshan_siswa",
                },
                {
                    model: models.lembar_jawaban,
                    as: "lembar_jawaban",
                    include: [
                        {
                            model: models.soal,
                            as: 'soal_ujian'
                        }
                    ]
                }
            ],

            limit: itemsPerPage,
            offset: offset,
        })
            .then(session => {
                res.json({
                    count: session.length,
                    data: session
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerGetById: async (req, res) => {
        let param = {
            id_lembar_soal: req.body?.id_lembar_soal,
            id_siswa: req.body.id_siswa
        }
        session.findOne({ where: param })
            .then(session => {
                res.json({
                    count: session.length,
                    data: session
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerAdd: async (req, res) => {
        let data = {
            id_lembar_soal: req.body.id_lembar_soal,
            id_siswa: req.body.id_siswa,
            id_event: req.body.id_event,
            nilai: req.body.nilai,
            waktu_pengerjaan: req.body.waktu_pengerjaan
        }
        session.create(data)
            .then(result => {
                res.json({
                    message: "data has been inserted",
                    data: data
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerTimer: async (req, res) => {
        let param = {
            id_lembar_soal: req.body.id_lembar_soal,
            id_siswa: req.body.id_siswa
        }

        session.findOne({ where: param })
            .then(result => {
                res.json({
                    message: "Ujian selesai",
                    data: result
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerStart: async (req, res) => {
        try {
            let start = new Date()
            let endDate = new Date()
            let setdetik = endDate.setMilliseconds((endDate.getMilliseconds()) + 600000)
            let end = new Date(setdetik)
                    
            //get lembar soal
            let lembarSoal = await lembar_soal.findOne({
                where: {tipe_ukt: req.body.tipe_ukt}
            })

            const id_lembar_soal = lembarSoal.id_lembar_soal
            const waktu = lembarSoal.waktu_pengerjaan
            
            let param = {
                id_lembar_soal: id_lembar_soal,
                id_siswa: req.body.id_siswa
            }
            let msg
            const cekData = await session.findOne({ where: param })
            if (!cekData) {
                let data = {
                    id_lembar_soal: id_lembar_soal,
                    id_siswa: req.body.id_siswa,
                    id_event: req.body.id_event,
                    nilai: 0,
                    start: start,
                    finish: end
                }
                session.create(data)
                    .then(res => {
                        msg = "Ujian dimulai"
                    })
                    .catch(error => {
                        return res.json({
                            message: error.message
                        })
                    })
            } else {
                msg = ("Ujian sudah dimulai")
            }

            //get soal untuk ujian
            soal.findAll({
                where: {
                    id_lembar_soal: id_lembar_soal
                },
                order: [
                    Sequelize.fn('RAND')
                ],
                limit: 20
            })
            .then(soal => {
                res.json({
                    message: msg,
                    count: soal.length,
                    waktu: waktu,
                    soals: soal
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
        } catch (error) {
            res.json({
                message: error.message
            })
        }
    },
    controllerFinish: async (req, res) => {
        let finish = new Date()

        let param = {
            id_lembar_soal: req.body.id_lembar_soal,
            id_siswa: req.body.id_siswa
        }

        let data = {
            nilai: req.body.nilai,
            // waktu_pengerjaan: req.body.waktu_pengerjaan,
            finish: finish
        }
        console.log(data);
        session.update(data, { where: param })
            .then(result => {
                res.json({
                    message: "Ujian selesai",
                    data: data
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerEdit: async (req, res) => {
        let param = {
            id_session: req.params.id
        }
        let data = {
            id_lembar_soal: req.body.id_lembar_soal,
            id_siswa: req.body.id_siswa,
            nilai: req.body.nilai,
            waktu_pengerjaan: req.body.waktu_pengerjaan
        }
        session.update(data, { where: param })
            .then(result => {
                res.json({
                    message: "data has been updated"
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
    controllerDelete: async (req, res) => {
        let param = {
            id_role: req.params.id
        }
        role.destroy({ where: param })
            .then(result => {
                res.json({
                    massege: "data has been deleted"
                })
            })
            .catch(error => {
                res.json({
                    message: error.message
                })
            })
    },
}