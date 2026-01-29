source("0 data.R")
needs(ggbeeswarm, lubridate)

# read ----------------------------------------------------------

fms_major <- read_excel("data/FMS.xlsx", sheet = "Major FMS by country") %>%
  select(1, 2,
         year = 3, 
         val = 4) %>%
  print()

fms_not <- read_excel("data/FMS.xlsx", sheet = "FMS 2025 notifications") %>%
  select(country = 1, cat = 2, 
         3,
         date = 4, 
         val = 5) %>%
  print()

fms_not %>% 
  ggplot() +
  aes("", date) +
  geom_beeswarm(aes(size = val, col = cat),
                cex = 3) +
  scale_size_area(max_size = 15)
