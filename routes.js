// routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); 
const cors = require('cors')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')



router.use(cors());
router.use(express.json({ limit: '10mb' }));


const connection = mysql.createPool({
    user: 'ukdj3xe4ryhb59st',
    host: 'brbw7bzgyjlr8ncyztvk-mysql.services.clever-cloud.com',
    database: 'brbw7bzgyjlr8ncyztvk',
    password: 'Gxc7epeGR6541ezRUwwa',
})


function generateUniqueId(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length); 
}


router.get('/register2', async (req, res) => {
    const { username, login, email } = req.query; 

    try {
        // const [userExist] = await connection.query(`
        // SELECT * FROM register 
        // WHERE username = ? 
      
             
        // `, [username]);

        const [userExist] = await connection.query(`DESCRIBE register`)
   
        for(let i = 0; i<userExist.length; i++){
            console.log(userExist[i].Field)
        }
        res.status(200).json(userExist);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка при отриманні даних' });
    }
});



router.post('/register', async (req, res) => {
    const { username, login, email, password } = req.body;
   
    try {
        if (req.body) {
            const [userExist] = await connection.query(`
            SELECT username, login, email FROM register`);
        
        // if (userExist.length > 0) {
        //     let errorMessage = '';
        //     userExist.forEach(user => {
        //         if (user.username === username) {
        //             errorMessage = 'Користувач з таким іменем вже існує.\n';
        //         }
        //         if (user.login === login) {
        //             errorMessage += 'Користувач з таким логіном вже існує.\n';
        //         }
        //         if (user.email === email) {
        //             errorMessage += 'Користувач з такою електронною адресою вже існує.\n';
        //         }
        //     });
        
        //     return res.status(403).json({
        //         messageUsername: errorMessage
        //     });
        // }
            let isUsername = {
                username: false,
                login: false,
                email: false
            };

            for(let i = 0; i<userExist.length; i++){

                 if(userExist[i].username === username){
                    isUsername.username = true
                    
                 }
                 if(userExist[i].login === login){
                    isUsername.login = true
                   
                 }
                 if(userExist[i].email === email){
                    isUsername.email = true
                    
                 }          
            }
        
            let errorMessages = [];

            if (isUsername.username) {
                errorMessages.push({username:'Користувач з username вже існує'});
            }
            
            if (isUsername.login) {
                errorMessages.push({login:'Користувач з login вже існує'});
            }
            
            if (isUsername.email) {
                errorMessages.push({email:'Користувач з email вже існує'});
            }
            
            if (errorMessages.length > 0) {
                return res.status(403).json(errorMessages);
            }
           
            const codePage = generateUniqueId(6);
            const token = generateToken({ userId: codePage }, 'secretKey');
              
          
            
          await connection.query(
                `INSERT INTO register (username, login, email, password, code_user, token) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [username, login, email, password, codePage, token]
            );

            await connection.query(
                `INSERT INTO register_user (id) 
                VALUES (?)`,
                [codePage]
            );

            await connection.query(
                `INSERT INTO register_token (user_token) 
                VALUES (?)`,
                [token]
            );

            
    

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'jemmytorshop@gmail.com',
                        pass: 'oraf ftzi bcns yjau'
                    }
                });

                const mailOptions = {
                    from: email,
                    to: email,
                    subject: 'Підтвердження реєстрації',
                    html: `<p>Ваш код ${codePage}</p>`
                };

                await transporter.sendMail(mailOptions);

                return res.status(200).json({
                    message: 'Лист для підтвердження коду відправлено на вашу електронну пошту.',
                    access_token: token,
                    verification_code: codePage
                });
            }
        }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка при реєстрації' });
    }
});





function generateToken (token, secretKey){
     return jwt.sign(token, secretKey, { expiresIn: '1h' })
}





router.post('/login', async (req, res) => {
   const {username, login, email, password} = req.body

    try {
        const [registerUser] = await connection.query(
            `SELECT username, login, email, password FROM register `);

        let isUser = false 
        let isError = false
        
        for (let i = 0; i < registerUser.length; i++) {
            let user = registerUser[i];
            let isMatch = true;
            for (let key in user) {
                if ( user[key] !== req.body[key]) {
                    isError = true;
                    isMatch = false;
                    break;
                    
                }
            }
            if (isMatch) {
                isError = false
                isUser = true;
                break;
            }
        }

            
        if (isUser) {

       
    
  
        const codePage = generateUniqueId(6);

        const token = generateToken({ userId: codePage }, 'secretKey');

         const transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user: 'jemmytorshop@gmail.com',
                pass: 'oraf ftzi bcns yjau'
            }
        });

   
        const mailOptions = {
            from: email,
            to: email,
            subject: 'Підтвердження логізації',
            html: `<p>Ваш код ${codePage}</p>`
        };

   
        transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: 'Error at send email' });
        } else {
            try {
                await connection.query(`
                    UPDATE register SET code_user = ? 
                    WHERE username = ? AND login = ?`, [codePage, username, login]);
             
                await connection.query(`
                    UPDATE register SET token = ? 
                    WHERE username = ? AND login = ?`, [token, username, login]);

                return res.status(200).json({ message: 'Login success', access_token: token });
               
            } catch (error) {
                console.log(error);

                return res.status(500).json({ message: 'An error occurred while updating the user code' });
            }
        }
        });
    }
        if (isError) {
                 res.status(403).json({message:'User is not exist'});
        }
            
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});


router.post('/register/verify', async (req, res) => {
      

 try {
    const [result] = await connection.query(`SELECT * FROM register`);
    console.log(result)

    const checkCodeArray = [];

    for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
           
            checkCodeArray.push(req.body[key]);
        }
    }

    const checkCodeString = checkCodeArray.join('');  

    let isCode = true;
    let token;

    for(let i = 0; i< result.length; i++){
    
        if(result[i].code_user == checkCodeString){
        token = result[i].token;
        isCode  = true;
        let y = await connection.query(`SELECT * FROM register`)
        break;
        }
        else{
        isCode = false
        
        }
    }

    if(isCode){
       
        console.log(token)
        res.status(200).json({ message: 'The code is correct' , token: token});
    }else {
        res.status(400).json({ message: 'The code is not correct' });
    } 
    
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }


})

let passwordResetTokens = {};



router.post('/forgotPassword', async (req, res) => {
    const { email } = req.body;
    const codePage = generateUniqueId(6);
    const token = generateToken({ userId: codePage }, 'secretKey');
    const expires = Date.now() + 3600000; 
    passwordResetTokens[email] = { token, expires };
    let isUser = false;
    

    try{
        
        if(Object(email).length>0){
             
            const [connectionDB] = await connection.query('SELECT * FROM register');
        
        for (let i = 0; i < connectionDB.length; i++) {
            if (connectionDB[i].email === email) {
                isUser = true;
                 break;
            }
        }

        if (!isUser) {
           res.status(403).json({ message: 'The user with this email does not exist' });
        }
    
         if(isUser){
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'jemmytorshop@gmail.com',
                    pass: 'oraf ftzi bcns yjau'
                }
            });
        
            await connection.query(`
                UPDATE register 
                SET token = ?, code_user = ? 
                WHERE email = ?`, [token, codePage, email]);
        
            const mailOptions = {
                user: 'jemmytorshop@gmail.com',
                to: email,
                subject: 'Password Reset',
                html: `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                       <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                       <p>https://jovial-blini-d5bb4d.netlify.app/resetPassword?token=${token}</p>
                       <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
            };
        
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        
            res.json({
                message: 'Лист для відновлення відправлено на вашу електронну пошту.',
                access_token: token,
            }).status(200);
         }
    
        }
       
        
       

    }
    catch(error){
        res.status(500).json({message:'Error send email'})
    }
  
});




router.post('/verifyToken', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token undefined' });
    }

    jwt.verify(token.split(' ')[1], 'secretKey', (err, decodedToken) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        } else {
            try {
                console.log('Decoded Token:', decodedToken);
                const userId = decodedToken.userId;
                console.log('User ID:', userId);
        
                return res.status(200).json({ message: 'Token updated successfully' });
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    return res.status(400).json({ message: 'Token expired' });
                } 
            }
        }
        
    });
});

router.post('/resetPassword', async (req, res)=>{
   const {oldPassword, newPassword, confirmNewPassword, token}  = req.body
    console.log(req.body)

    const [resetPassword] =  await connection.query(`SELECT * FROM register`)

    let isResetPassword = false;

    for(let i = 0; i<resetPassword.length; i++){

        if(resetPassword[i].token === token && resetPassword[i].password === oldPassword){
             isResetPassword = true
             break;
        }
    }
    if(!isResetPassword){
        res.status(403).json({message:'Password is not change'})
    }

    if(isResetPassword){
     await connection.query(`UPDATE register SET password = ? WHERE token = ?`, [newPassword, token])

        res.status(200).json({message:'Password is change'})
    }

  
})


router.get('/api', async function(req, res) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ message: 'Token undefined' });
    }
   
    console.log(token)


    jwt.verify(token.split(' ')[1], 'secretKey', async (err, decodedToken) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
            
        } else {
            try {
                console.log('Decoded222 Token:', decodedToken);
                const userId = decodedToken.userId;

                if (userId) {
                    try {
                        const [results] = await connection.query(`SELECT * FROM register`);
                       
                        let resultData;

                        for(let i = 0; i<results.length; i++){
                            if(results[i].code_user === userId){
                                
                                 resultData = results[i];
                            }
                        }
                        return res.status(200).json(resultData)
                    } catch (error) {
                        console.error('Помилка запиту до бази даних:', error);
                    }
                }
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    return res.status(400).json({ message: 'Token expired' });
                } 
            }
        }
    });
});


router.post('/commodity', async (req, res)=>{
   console.log(req.body)
   try{
   
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is missing or empty' });
      }
  

        let {number, price, name, telephone, address, email} = req.body
        await connection.query(`INSERT INTO buy (name, address, email, telephone, price, number) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, address, email, telephone, price, number]
        )
        const [rows] = await connection.query(`SELECT * FROM buy`)
        res.status(200).json(rows)
     

   }
   catch(er){
    console.log(er)
   }
   
})


router.post('/communication', async (req, res)=>{
    console.log(req.body)
    try{
    
     if (!req.body || Object.keys(req.body).length === 0) {
         return res.status(400).json({ error: 'Request body is missing or empty' });
       }
   
 
         let {number, name, email, message} = req.body
         await connection.query(`INSERT INTO communication (name, email, number, message) VALUES (?, ?, ?, ?)`,
             [name, email, number, message]
         )
         const [rows] = await connection.query(`SELECT * FROM communication`)
         res.status(200).json(rows)
      
 
    }
    catch(er){
     console.log(er)
    }
    
 })


module.exports = router;

