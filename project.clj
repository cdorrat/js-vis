(defproject js-vis "0.1.0-SNAPSHOT"
  :description "Scratch app for javascript experiments"
  :url "https://github.com/cdorrat/js-vis"
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [compojure "1.1.8"]]
  :plugins [[lein-ring "0.8.11"]]
  :ring {:handler js-vis.handler/app}
  :profiles
  {:dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                        [ring-mock "0.1.5"]]}})
