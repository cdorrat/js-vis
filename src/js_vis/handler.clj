(ns js-vis.handler
  (:require [compojure 
             [core :refer :all]
             [handler :as handler]
             [route :as route]]
            [ring.util.response :as rr])
 )

(defroutes app-routes
  (GET "/" [] (rr/redirect "/index.html"))
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (handler/site app-routes))
