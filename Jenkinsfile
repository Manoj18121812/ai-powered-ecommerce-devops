pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Compose') {
            steps {
                sh 'docker compose config -q'
            }
        }

        stage('Build Application') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy Application') {
            steps {
                sh 'docker compose up -d'
            }
        }

        stage('Deploy Application') {
    steps {
        dir('/home/ubuntu/projects/ecommerce-platform') {
            sh 'docker compose up -d --build'
        }
    }
        }
    

    post {
        success {
            echo 'E-commerce application deployed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins console output.'
        }
    }
}
