
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
                sh 'docker compose -p ecommerce-platform build'
            }
        }
      
stage('Trivy Image Scan') {
    steps {
        sh 'trivy image --severity HIGH,CRITICAL ecommerce-platform-backend'
        sh 'trivy image --severity HIGH,CRITICAL ecommerce-platform-frontend'
    }
}


        stage('Deploy Application') {
            steps {
                sh 'docker compose -p ecommerce-platform up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'docker compose -p ecommerce-platform ps'
                sh 'curl -fsS http://localhost:5173/ > /dev/null'
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

