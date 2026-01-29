source("0 data.R")
needs(lubridate, forcats, sf)

crs <- "+proj=robin"

# read ----------------------------------------------------------

peace <- read_excel("data/Data_GS US scrolly 2026.xlsx",
                    sheet = "Peace deals",
                    na = "NA") %>%
  select(name = 1,
         coords,
         res = 3,
         agree = 4,
         min = 8) %>%
  mutate(res = str_sub(res, 1, 3), min = ifelse(min == "No", NA, min),
         war = ifelse(agree == "NA (no war in 2025)",
                      "No war in 2025", NA)) %>%
  select(-agree) %>%
  print()

peace_sf <- peace %>%
  euiss_coords_to_sf() %>%
  print()

peace_sf %>% 
  st_write("web/peace_sf.geojson", delete_dsn = TRUE)

peace_countries <- peace %>% 
  separate(name, into = c("a", "b"), sep = "-") %>%
  mutate(across(c(a, b), str_trim)) %>%
  separate(b, into = c("b", "c"), sep = " ") %>%
  select(a, b) %>% 
  pivot_longer(a:b,
               values_to = "country") %>% 
  distinct(country) %>% 
  euiss_left_join(euiss_gisco() %>% 
                    select(NAME_ENGL, ISO3_CODE),
                  country = "country") %>%
  print()

peace_countries %>%
  st_write("web/peace_countries.geojson", delete_dsn = TRUE)

# map presidential aggregates ---------------------------------------------

peace_sf %>%
  # tail()
  ggplot() +
  geom_sf(data = euiss_gisco(), fill = NA) +
  geom_sf(data = . %>% filter(!is.na(min)),
          aes(shape = "Minerals deal"),
          size = 3) +
  geom_sf(aes(col = res)) +
  geom_text_euiss(
    data = . %>%
      st_transform(crs) %>%
      euiss_sf_to_coords(),
    aes(lon, lat + 300000, 
        label = name),
    vjust = 1,
    angle = 45,
    fontface = "bold"
  ) +
  geom_text_euiss(
    data = . %>%
      st_transform(crs) %>%
      euiss_sf_to_coords(),
    aes(lon, lat - 300000, 
        label = str_wrap(min, 120)),
    vjust = 1,
    angle = 45
  ) +
  scale_shape_manual(values = 21) +
  coord_sf(
    crs = crs,
    xlim = c(-1500000, 9000000),
    ylim = c(-600000, 9000000),
    datum = NA
  ) +
  labs(title = "Trump's 'peace' deals and the strings attached", col = NULL, shape = NULL)
ggsave_euiss("img/7 peace_sf.jpg",
             publication = "brief",
             w = "full",
             h = .5)
