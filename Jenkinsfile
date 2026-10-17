
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION = 'us-east-1'
        EKS_CLUSTER = 'ecommerce-eks'
        DOCKERHUB_USER = 'manoj1812'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
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

       

        stage('Build Images') {
            steps {
                sh '''
                    docker build \
                      -t ${DOCKERHUB_USER}/ecommerce-backend:${BUILD_NUMBER} \
                      -t ${DOCKERHUB_USER}/ecommerce-backend:latest \
                      ./backend

                    docker build \
                      --build-arg VITE_API_URL=/api \
                      -t ${DOCKERHUB_USER}/ecommerce-frontend:${BUILD_NUMBER} \
                      -t ${DOCKERHUB_USER}/ecommerce-frontend:latest \
                      ./frontend
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    trivy image --severity HIGH,CRITICAL \
                      ${DOCKERHUB_USER}/ecommerce-backend:${BUILD_NUMBER}

                    trivy image --severity HIGH,CRITICAL \
                      ${DOCKERHUB_USER}/ecommerce-frontend:${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_TOKEN'
                )]) {
                    sh '''
                        set +x
                        echo "$DH_TOKEN" | docker login \
                          --username "$DH_USER" --password-stdin

                        docker push ${DOCKERHUB_USER}/ecommerce-backend:${BUILD_NUMBER}
                        docker push ${DOCKERHUB_USER}/ecommerce-backend:latest
                        docker push ${DOCKERHUB_USER}/ecommerce-frontend:${BUILD_NUMBER}
                        docker push ${DOCKERHUB_USER}/ecommerce-frontend:latest

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                    kubectl set image deployment/ecommerce-backend \
                      backend=${DOCKERHUB_USER}/ecommerce-backend:${BUILD_NUMBER}

                    kubectl set image deployment/ecommerce-frontend \
                      frontend=${DOCKERHUB_USER}/ecommerce-frontend:${BUILD_NUMBER}

                    kubectl rollout status deployment/ecommerce-backend --timeout=180s
                    kubectl rollout status deployment/ecommerce-frontend --timeout=180s
                '''
            }
        }

        stage('Verify EKS') {
            steps {
                sh '''
                    kubectl get deployments
                    kubectl get pods
                    kubectl get svc
                    curl -fsS --max-time 20 \
                      http://$(kubectl get svc ecommerce-frontend \
                      -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/ \
                      -o /dev/null
                '''
            }
        }
    }

    post {
        success {
            echo 'E-commerce application deployed successfully to EKS!'
        }

        failure {
            echo 'Pipeline failed. Check the Jenkins console output.'
        }
    }
}
