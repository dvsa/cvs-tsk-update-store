const liquibase = require("liquibase");
const path = require("path");

(async () => await liquibase({
    liquibase: path.join(__dirname, "../node_modules/liquibase/lib/liquibase-4.0.0/liquibase"),
    changeLogFile: path.join(__dirname, "../cvs-nop/changelog-master.xml"),
    url: 'jdbc:mysql://localhost:49169/CVSBNOP',
    username: "root",
    password: "12345",
    classpath: path.join(__dirname, "../tests/resources/mysql-connector-java-8.0.23.jar")
})
        .run("update")
        .then(() => console.log("success"))
        .catch(err => {
            console.error(err);
        })
)();
