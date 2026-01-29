source("0 data.R")
needs(sf)

# read ----------------------------------------------------------

tariffs_ieepa <- read_excel("data/tariffs.xlsx", sheet = "IEEPA") %>%
  select(
    country = 1,
    cat = 2,
    val = 3,
    date = 4,
    deal = 5
  ) %>%
  print()

tariffs_ieepa_sf <- tariffs_ieepa %>%
  # euissGeo::euiss_left_join(euissGeo::euiss_gisco(),
                            # verbose = TRUE)
  left_join(euiss_gisco(),
            by = c("country" = "NAME_ENGL")) %>% 
  st_as_sf() %>% 
  print()

tariffs_ieepa_sf %>% 
  mutate(cat = ifelse(str_detect(cat, "Recipro"),
                      "Reciprocal", cat)) %>% 
  ggplot() +
  geom_sf(aes(fill = cat,
              col = deal),
          linewidth = .5,
          alpha = .5) +
  scale_color_manual(values = c(NA, "#000")) +
  coord_sf(crs = "+proj=robin", datum = NA)

tariffs_ieepa %>% 
  ggplot() +
  aes(date, "") +
  geom_beeswarm(aes(size = val, col = cat), cex = 1.5) +
  scale_size_area(max_size = 3)
