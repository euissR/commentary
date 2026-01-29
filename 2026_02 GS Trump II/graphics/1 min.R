source("0 data.R")


# type of viz ---------------------------------------------------

# annotated map?
# timeline?

# read ----------------------------------------------------------

min <- read_excel("data/critical mineral and peace deals.xlsx",
                  sheet = "Mineral deals") %>% 
  print()

peace <- read_excel("data/critical mineral and peace deals.xlsx",
                    sheet = "Peace deals") %>% 
  print()

# map ------------------------------------------------------------

min_sf <- min %>% 
  euiss_left_join(euiss_gisco(),
                  # country_format = "country.name",
                  country = "Country")
  
